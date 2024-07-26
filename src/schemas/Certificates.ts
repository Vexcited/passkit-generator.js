import Joi from "joi";

export interface CertificatesSchema {
	wwdr: string | Uint8Array;
	signerCert: string | Uint8Array;
	signerKey: string | Uint8Array;
	signerKeyPassphrase?: string;
}

const binary = Joi.custom((obj) => obj instanceof Uint8Array);

export const CertificatesSchema = Joi.object<CertificatesSchema>()
	.keys({
		wwdr: Joi.alternatives(binary, Joi.string()).required(),
		signerCert: Joi.alternatives(binary, Joi.string()).required(),
		signerKey: Joi.alternatives(binary, Joi.string()).required(),
		signerKeyPassphrase: Joi.string(),
	})
	.required();
