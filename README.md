# node-aws-pca

[![npm version](https://badge.fury.io/js/aws-pca.svg)](https://badge.fury.io/js/aws-pca)

A library to generate and fetch a certificate for HTTPS use using [AWS Private Certificate Authority (PCA)](https://aws.amazon.com/certificate-manager/private-certificate-authority/).

## Install

Required:

- [aws-sdk](https://www.npmjs.com/package/aws-sdk) for calling AWS

`npm i aws-pca aws-sdk`

## Usage

For more documentation, see source code and tests in `src/`

```js
// The following has been personally tested to work

const AWS = require('aws-sdk')
const PCA = require('aws-pca').PCA

export async function sample () {
  // The value of your CA (Certificate Authority) ARN in AWS PCA
  const CA_ARN = 'arn:aws:acm-pca:us-west-2:123456789012:certificate-authority/4819f73f-af7c-4abf-8753-62e40512cac6'

  const pca = new PCA(AWS, CA_ARN)

  // Get the CA certificate if you need to add it to your trust stores
  const caData = await pca.getCaCertificate()

  console.log('Certificate Authority Data')
  console.log(caData)
  console.log('--------')

  // Create the server certificate
  const reqCertRes = await pca.requestCertificate({
    DomainName: 'test.int',
    SubjectAlternativeNames: ['blah.test.int']
  })

  console.log('Request Certificate Response')
  console.log(reqCertRes)
  console.log('--------')

  const cert = await pca.exportCertificate(reqCertRes.CertificateArn, 'password-to-set-for-the-key')

  console.log('Server Certificate')
  console.log(cert)
}

sample().then((c) => {
  process.exit(0)
}).catch((e) => {
  console.error(e)
  process.exit(-1)
})
```

## Recommended

- [aws-pca-ca-gen](https://github.com/theogravity/aws-pca-ca-gen) generate a root CA for AWS PCA
- https://smallstep.com/blog/everything-pki.html - If you do not know how certs work, read this first

