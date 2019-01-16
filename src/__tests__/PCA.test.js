/* eslint-env jest */
import AWS from 'aws-sdk'

import PCA from '../PCA'

const CSR_TEST_DATA = {
  hash: 'sha256',
  country: 'US',
  state: 'California',
  locality: 'San Francisco',
  organization: 'Fake Company, Inc',
  organizationUnit: 'Engineering',
  commonName: 'fake.com',
  altNames: ['alt-fake.com']
}

const CA_TEST_ARN =
  'arn:aws:acm-pca:us-west-2:123456789012:certificate-authority/4819f73f-af7c-4abf-8753-62e40512cac6'
const CERT_TEST_ARN =
  'arn:aws:acm-pca:us-west-2:123456789012:certificate-authority/4819f73f-af7c-4abf-8753-62e40512cac6/certificate/5e4c069a8eafc9bdb1fbc1c2a977160e'

const acmpca = new AWS.ACMPCA()
const acm = new AWS.ACM()

acm.requestCertificate = jest.fn().mockImplementation(() => {
  return {
    promise: () => {
      return Promise.resolve({
        CertificateArn: CERT_TEST_ARN
      })
    }
  }
})

acmpca.getCertificate = jest.fn().mockImplementation(() => {
  return {
    promise: () => {
      return Promise.resolve({
        Certificate: '-----BEGIN CERTIFICATE-----',
        CertificateChain: '-----BEGIN CERTIFICATE-----'
      })
    }
  }
})

acmpca.getCertificateAuthorityCertificate = jest.fn().mockImplementation(() => {
  return {
    promise: () => {
      return Promise.resolve({
        Certificate: '-----BEGIN CERTIFICATE-----',
        CertificateChain: '-----BEGIN CERTIFICATE-----'
      })
    }
  }
})

acm.exportCertificate = jest.fn().mockImplementation(() => {
  return {
    promise: () => {
      return Promise.resolve({
        Certificate: '-----BEGIN CERTIFICATE-----',
        CertificateChain: '-----BEGIN CERTIFICATE-----',
        PrivateKey: '-----BEGIN RSA PRIVATE KEY-----'
      })
    }
  }
})

describe('PCA class', () => {
  it('should create an instance of the PCA', () => {
    const pca = new PCA(AWS, CA_TEST_ARN)
    pca.acmpca = acmpca
    pca.acm = acm

    expect(pca).toBeDefined()
  })

  it('should create a certificate', async () => {
    const pca = new PCA(AWS, CA_TEST_ARN)
    pca.acmpca = acmpca
    pca.acm = acm

    const issueData = await pca.requestCertificate({
      DomainName: 'test.int',
      SubjectAlternativeNames: ['blah.test.int']
    })

    expect(acm.requestCertificate).toBeCalledWith({
      CertificateAuthorityArn: CA_TEST_ARN,
      DomainName: 'test.int',
      SubjectAlternativeNames: ['blah.test.int']
    })

    expect(issueData.CertificateArn).toBe(CERT_TEST_ARN)
  })

  it('should export a certificate', async () => {
    const pca = new PCA(AWS, CA_TEST_ARN)
    pca.acmpca = acmpca
    pca.acm = acm

    const issueData = await pca.requestCertificate({
      DomainName: 'test.int',
      SubjectAlternativeNames: ['blah.test.int']
    })

    const certData = await pca.exportCertificate(
      issueData.CertificateArn,
      'test'
    )

    expect(acm.exportCertificate).toBeCalledWith({
      CertificateArn: CERT_TEST_ARN,
      Passphrase: 'test'
    })
    expect(certData.Certificate).toContain('-----BEGIN CERTIFICATE-----')
    expect(certData.CertificateChain).toContain('-----BEGIN CERTIFICATE-----')
    expect(certData.PrivateKey).toContain('-----BEGIN RSA PRIVATE KEY-----')
  })

  it('should get the Certificate Authority certificate', async () => {
    const pca = new PCA(AWS, CA_TEST_ARN)
    pca.acmpca = acmpca
    pca.acm = acm

    const certData = await pca.getCaCertificate()

    expect(certData.Certificate).toContain('-----BEGIN CERTIFICATE-----')
    expect(certData.CertificateChain).toContain('-----BEGIN CERTIFICATE-----')
  })
})
