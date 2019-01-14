# node-aws-pca

[![npm version](https://badge.fury.io/js/aws-pca.svg)](https://badge.fury.io/js/aws-pca)

A library to generate and fetch a certificate for HTTPS use using AWS Private Certificate Authority (PCA).

## Install

Required:

- [aws-sdk](https://www.npmjs.com/package/aws-sdk) for calling AWS
- [pem](https://www.npmjs.com/package/pem) for generating CSRs (Certificate Signing Requests)

`npm i aws-pca pem aws-sdk`

## Usage

```js
import AWS from 'aws-sdk'
import pem from 'pem'
import { PCA } from 'aws-pca'

export async function sample () {
  // See https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ACMPCA.html#constructor-property
  // for possible options
  const acmpca = new AWS.ACMPCA()

  // The value of your CA (Certificate Authority) ARN in AWS PCA
  const CA_ARN = 'arn:aws:acm-pca:us-west-2:123456789012:certificate-authority/4819f73f-af7c-4abf-8753-62e40512cac6'

  const pca = new PCA(acmpca, pem, CA_ARN)

  // Create a CSR + client key which will be used to issue a certificate
  // See https://www.deineagentur.com/projects/pem/module-pem.html#.createCSR

  const csrData = await pca.createCSR({
    hash: 'sha256',
    country: 'US',
    state: 'California',
    locality: 'San Francisco',
    organization: 'Fake Company, Inc',
    organizationUnit: 'Engineering',
    commonName: 'fake.com',
    altNames: ['alt-fake.com']
  })

  // Create the server certificate
  // See https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ACMPCA.html#issueCertificate-property
  // no need to specify CertificateAuthorityArn since you specified it in the constructor

  const issueData = await pca.issueCertificate(csrData.csr, {
    SigningAlgorithm: 'SHA256WITHRSA',
    Validity: {
      Type: 'YEARS',
      Value: 1
    }
  })

  // Get the server certificate
  // Note: You might have to wait a few seconds if you just issued the certificate
  // before you can fetch it as AWS PCA has not actually created it yet

  const certData = await pca.getCertificate(issueData.CertificateArn)

  // certData will have { Certificate, CertificateChain }

  // Get the CA certificate if you need to add it to your trust stores
  const caData = await pca.getCaCertificate()

  // caData will have { Certificate, CertificateChain }
}

```

## Recommended

- [aws-pca-ca-gen](https://github.com/theogravity/aws-pca-ca-gen) generate a root CA for AWS PCA
- https://smallstep.com/blog/everything-pki.html - If you do not know how certs work, read this first

