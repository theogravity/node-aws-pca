/* eslint-env jest */
import AWS from 'aws-sdk'
import pem from 'pem'

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

describe('PCA class', () => {
  it('should create an instance of the PCA', () => {
    const acmpca = new AWS.ACMPCA()

    const pca = new PCA(acmpca, pem, CA_TEST_ARN)

    expect(pca).toBeDefined()
  })

  it('should create a CSR and client key', async () => {
    const acmpca = new AWS.ACMPCA()

    const pca = new PCA(acmpca, pem, CA_TEST_ARN)

    const data = await pca.createCSR(CSR_TEST_DATA)

    expect(data.csr).toBeDefined()
    expect(data.clientKey).toBeDefined()

    expect(data.csr).toContain('-----BEGIN CERTIFICATE REQUEST-----')
    expect(data.clientKey).toContain('-----BEGIN RSA PRIVATE KEY-----')
  })

  it('should issue a certificate', async () => {
    const acmpca = new AWS.ACMPCA()

    const pca = new PCA(acmpca, pem, CA_TEST_ARN)

    acmpca.issueCertificate = jest.fn().mockImplementationOnce(() => {
      return {
        promise: () => {
          return Promise.resolve({
            CertificateArn: CERT_TEST_ARN
          })
        }
      }
    })

    const csrData = await pca.createCSR(CSR_TEST_DATA)

    const issueData = await pca.issueCertificate(csrData.csr, {
      SigningAlgorithm: 'SHA256WITHRSA',
      Validity: {
        Type: 'YEARS',
        Value: 1
      }
    })

    expect(acmpca.issueCertificate).toBeCalledWith({
      CertificateAuthorityArn: CA_TEST_ARN,
      Csr: Buffer.from(csrData.csr, 'ascii'),
      SigningAlgorithm: 'SHA256WITHRSA',
      Validity: {
        Type: 'YEARS',
        Value: 1
      }
    })

    expect(issueData.CertificateArn).toBe(CERT_TEST_ARN)
  })

  it('should fetch a certificate', async () => {
    const acmpca = new AWS.ACMPCA()

    const pca = new PCA(acmpca, pem, CA_TEST_ARN)

    acmpca.issueCertificate = jest.fn().mockImplementationOnce(() => {
      return {
        promise: () => {
          return Promise.resolve({
            CertificateArn: CERT_TEST_ARN
          })
        }
      }
    })

    const csrData = await pca.createCSR(CSR_TEST_DATA)

    const issueData = await pca.issueCertificate(csrData.csr, {
      SigningAlgorithm: 'SHA256WITHRSA',
      Validity: {
        Type: 'YEARS',
        Value: 1
      }
    })

    acmpca.getCertificate = jest.fn().mockImplementationOnce(() => {
      return {
        promise: () => {
          return Promise.resolve({
            Certificate: '-----BEGIN CERTIFICATE-----',
            CertificateChain: '-----BEGIN CERTIFICATE-----'
          })
        }
      }
    })

    const certData = await pca.getCertificate(issueData.CertificateArn)

    expect(certData.Certificate).toContain('-----BEGIN CERTIFICATE-----')
    expect(certData.CertificateChain).toContain('-----BEGIN CERTIFICATE-----')
  })

  it('should get the Certificate Authority certificate', async () => {
    const acmpca = new AWS.ACMPCA()

    const pca = new PCA(acmpca, pem, CA_TEST_ARN)

    acmpca.getCertificateAuthorityCertificate = jest
      .fn()
      .mockImplementationOnce(() => {
        return {
          promise: () => {
            return Promise.resolve({
              Certificate: '-----BEGIN CERTIFICATE-----',
              CertificateChain: '-----BEGIN CERTIFICATE-----'
            })
          }
        }
      })

    const certData = await pca.getCaCertificate()

    expect(certData.Certificate).toContain('-----BEGIN CERTIFICATE-----')
    expect(certData.CertificateChain).toContain('-----BEGIN CERTIFICATE-----')
  })
})
