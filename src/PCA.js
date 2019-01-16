export default class PCA {
  /**
   * @param {AWS} AWS An AWS() instance
   * @param {String} caArn The Amazon Resource Name (ARN) of the PCA Certificate Authority item.
   * Must be in form of arn:aws:acm-pca:region:account:certificate-authority/12345678-1234-1234-1234-123456789012
   * @param {object} data Optional data
   * @param {object} data.acmOptions Options to use when initializing AWS.ACM()
   * @param {object} data.acmPcaOptions Options to use when initializing AWS.ACMPCA()
   */
  constructor (AWS, caArn, { acmOptions, acmPcaOptions } = {}) {
    this.acm = new AWS.ACM(acmOptions)
    this.acmpca = new AWS.ACMPCA(acmPcaOptions)
    this.caArn = caArn
  }

  /**
   * @typedef {Object} ReqCertRes
   * @property {String} CertificateArn ARN of the issued certificate
   */

  /**
   * Wrapper around ACM#requestCertificate()
   *
   * @param {Object} options Options object
   * @param {String} options.DomainName
   * @param {Array<String>} options.SubjectAlternativeNames
   *
   * @link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ACM.html#requestCertificate-property
   *
   * Creates a certificate.
   * @returns {Promise<ReqCertRes>}
   */
  async requestCertificate (options) {
    return this.acm
      .requestCertificate({
        CertificateAuthorityArn: this.caArn,
        ...options
      })
      .promise()
  }

  /**
   * @typedef {Object} GetCertificateRes
   * @property {String} Certificate PEM base-64 formatted certificate
   * @property {String} CertificateChain PEM base-64 formatted certificate
   */

  /**
   * Wrapper around ACMPCA#getCertificateAuthorityCertificate
   *
   * Gets the Certificate Authority certificate stored in AWS PCA.
   *
   * @returns {Promise<GetCertificateRes>}
   */
  async getCaCertificate () {
    return this.acmpca
      .getCertificateAuthorityCertificate({
        CertificateAuthorityArn: this.caArn
      })
      .promise()
  }

  /**
   * @typedef {Object} ExportCertRes
   * @property {String} Certificate PEM base-64 formatted certificate
   * @property {String} CertificateChain PEM base-64 formatted certificate
   * @property {String} PrivateKey The PEM-encoded private key associated with the public key in the certificate
   */

  /**
   * Wrapper around ACM#exportCertificate
   *
   * Returns the certificate and key associated with it.
   *
   * @link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ACM.html#exportCertificate-property
   *
   * @param {String} CertificateArn The Certificate ARN returned from issueCertificate()
   * @param {String|Buffer} Passphrase Passphrase to set to the exported key. Must be length > 3
   * @returns {Promise<ExportCertRes>}
   */
  async exportCertificate (CertificateArn, Passphrase) {
    return this.acm
      .exportCertificate({
        CertificateArn,
        Passphrase
      })
      .promise()
  }
}
