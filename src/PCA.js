export default class PCA {
  /**
   * @param {ACMPCA} AWS An AWS.ACMPCA() instance
   * @param {PEM} pem pem module instance
   * @param {String} caArn The Amazon Resource Name (ARN) of the PCA Certificate Authority item.
   * Must be in form of arn:aws:acm-pca:region:account:certificate-authority/12345678-1234-1234-1234-123456789012
   */
  constructor (ACMPCA, pem, caArn) {
    this.acmpca = ACMPCA
    this.pem = pem
    this.caArn = caArn
  }

  /**
   * @typedef {Object} CreateCSRResponse
   * @property {String} csr
   * @property {String} clientKey
   */

  /**
   * This is a wrapper around PCA#createCSR()
   *
   * @link https://www.deineagentur.com/projects/pem/module-pem.html#.createCSR
   *
   * Creates a Certificate Signing Request
   * If client key is undefined, a new key is created automatically. The used key is included
   * in the callback return as clientKey
   * @static
   * @param {Object} [options] Optional options object
   * @param {String} [options.clientKey] Optional client key to use
   * @param {Number} [options.keyBitsize] If clientKey is undefined, bit size to use for generating a new key (defaults to 2048)
   * @param {String} [options.hash] Hash function to use (either md5 sha1 or sha256, defaults to sha256)
   * @param {String} [options.country] CSR country field
   * @param {String} [options.state] CSR state field
   * @param {String} [options.locality] CSR locality field
   * @param {String} [options.organization] CSR organization field
   * @param {String} [options.organizationUnit] CSR organizational unit field
   * @param {String} [options.commonName='localhost'] CSR common name field
   * @param {String} [options.emailAddress] CSR email address field
   * @param {String} [options.csrConfigFile] CSR config file
   * @param {Array}  [options.altNames] is a list of subjectAltNames in the subjectAltName field
   * @returns {Promise<CreateCSRResponse>} data
   */
  async createCSR (options) {
    return new Promise((resolve, reject) => {
      this.pem.createCSR(options, (err, data) => {
        if (err) {
          return reject(err)
        }

        resolve(data)
      })
    })
  }

  /**
   * @typedef {Object} IssueCertificateRes
   * @property {String} CertificateArn
   */

  /**
   * Wrapper around ACMPCA#issueCertificate() and calls ACMPCA#waitFor() to ensure it has been
   * created so getCertificate() can be subsequently called
   *
   * Creates the certificate using the AWS PCA, storing it in AWS.
   *
   * @link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ACMPCA.html#issueCertificate-property
   *
   * @param {string} csr CSR output from createCSR()
   * @param {ACMPCA.Types.IssueCertificateRequest} params
   * @returns {Promise<IssueCertificateRes>}
   */
  async issueCertificate (csr, params) {
    return new Promise(async (resolve, reject) => {
      try {
        const caData = await this.acmpca
          .issueCertificate({
            CertificateAuthorityArn: this.caArn,
            ...params,
            Csr: Buffer.from(csr, 'ascii')
          })
          .promise()

        this.acmpca.waitFor(
          'certificateIssued',
          {
            CertificateAuthorityArn: this.caArn,
            CertificateArn: caData.CertificateArn
          },
          (err, data) => {
            if (err) {
              return reject(err)
            }

            resolve({
              ...caData,
              ...data
            })
          }
        )
      } catch (e) {
        reject(e)
      }
    })
  }

  /**
   * @typedef {Object} GetCertificateRes
   * @property {String} Certificate PEM base-64 formatted certificate
   * @property {String} CertificateChain PEM base-64 formatted certificate
   */

  /**
   * Wrapper around ACMPCA#getCertificate()
   *
   * Gets the certificate stored in the AWS PCA.
   *
   * @link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ACMPCA.html#getCertificate-property
   *
   * @param {String} CertificateArn The Certificate ARN returned from issueCertificate()
   * @returns {Promise<GetCertificateRes>}
   */
  async getCertificate (CertificateArn) {
    return this.acmpca
      .getCertificate({
        CertificateAuthorityArn: this.caArn,
        CertificateArn
      })
      .promise()
  }

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
}
