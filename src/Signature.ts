import forge from "node-forge";
import type * as Schemas from "./schemas";

/**
 * Creates an hash for a buffer. Used by manifest
 *
 * @param buffer
 * @returns
 */

export function createHash(buffer: Uint8Array) {
	const hashFlow = forge.md.sha1.create();
  const binary = buffer.reduce((string, byte) => (string + String.fromCharCode(byte)), "")
	hashFlow.update(binary);

	return hashFlow.digest().toHex();
}

/**
 * Generates the PKCS #7 cryptographic signature for the manifest file.
 *
 * @method create
 * @params manifestBuffer     
 * @params certificates
 * @returns
 */

export function create(
	manifestBuffer: Uint8Array,
	certificates: Schemas.CertificatesSchema,
): Uint8Array {
	const signature = forge.pkcs7.createSignedData();

	signature.content = new forge.util.ByteStringBuffer(manifestBuffer);

	const { wwdr, signerCert, signerKey } = parseCertificates(
    getStringCertificates(certificates),
	);

	signature.addCertificate(wwdr);
	signature.addCertificate(signerCert);

	/**
	 * authenticatedAttributes belong to PKCS#9 standard.
	 * It requires at least 2 values:
	 * • content-type (which is a PKCS#7 oid) and
	 * • message-digest oid.
	 *
	 * Wallet requires a signingTime.
	 */

	signature.addSigner({
		key: signerKey,
		certificate: signerCert,
		digestAlgorithm: forge.pki.oids.sha1,
		authenticatedAttributes: [
			{
				type: forge.pki.oids.contentType,
				value: forge.pki.oids.data,
			},
			{
				type: forge.pki.oids.messageDigest,
			},
			{
				type: forge.pki.oids.signingTime,
			},
		],
	});

	/**
	 * We are creating a detached signature because we don't need the signed content.
	 * Detached signature is a property of PKCS#7 cryptography standard.
	 */

	signature.sign({ detached: true });

	/**
	 * Signature here is an ASN.1 valid structure (DER-compliant).
	 * Generating a non-detached signature, would have pushed inside signature.contentInfo
	 * (which has type 16, or "SEQUENCE", and is an array) a Context-Specific element, with the
	 * signed content as value.
	 *
	 * In fact the previous approach was to generating a detached signature and the pull away the generated
	 * content.
	 *
	 * That's what happens when you copy a fu****g line without understanding what it does.
	 * Well, nevermind, it was funny to study BER, DER, CER, ASN.1 and PKCS#7. You can learn a lot
	 * of beautiful things. ¯\_(ツ)_/¯
	 */

  return forge.util.binary.raw.decode(forge.asn1.toDer(signature.toAsn1()).getBytes());
}

/**
 * Parses the PEM-formatted passed text (certificates)
 *
 * @param element - Text content of .pem files
 * @param passphrase - passphrase for the key
 * @returns The parsed certificate or key in node forge format
 */

function parseCertificates(certificates: Schemas.CertificatesSchema) {
	const { signerCert, signerKey, wwdr, signerKeyPassphrase } = certificates;

	return {
		signerCert: forge.pki.certificateFromPem(signerCert as string),
		wwdr: forge.pki.certificateFromPem(wwdr as string),
		signerKey: forge.pki.decryptRsaPrivateKey(
			signerKey as string,
			signerKeyPassphrase,
		),
	};
}

function getStringCertificates(
	certificates: Schemas.CertificatesSchema,
): Record<
	keyof Omit<Schemas.CertificatesSchema, "signerKeyPassphrase">,
	string
> & { signerKeyPassphrase?: string } {
	return {
		signerKeyPassphrase: certificates.signerKeyPassphrase,
		wwdr: typeof certificates.wwdr === "string" ? certificates.wwdr : new TextDecoder().decode(certificates.wwdr),
		signerCert: typeof certificates.signerCert === "string" ? certificates.signerCert : new TextDecoder().decode(certificates.signerCert),
		signerKey: typeof certificates.signerKey === "string" ? certificates.signerKey : new TextDecoder    ().decode(certificates.signerKey),
	};
}
