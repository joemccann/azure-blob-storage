const { DefaultAzureCredential } = require('@azure/identity')
const { BlobServiceClient } = require('@azure/storage-blob')

const ERRORS = {
  missing: {
    account: 'Missing `account` parameter.',
    container: 'Missing `container` parameter.',
    content: 'Missing `content` parameter.',
    filename: 'Missing `filename` parameter'
  }
}

const streamToString = async (readableStream) => {
  return new Promise((resolve, reject) => {
    const chunks = []
    readableStream.on('data', (data) => {
      chunks.push(data.toString())
    })
    readableStream.on('end', () => {
      resolve(chunks.join(''))
    })
    readableStream.on('error', reject)
  })
}

const createBlobServiceClient = (account) => {
  //
  // Authenticate and then connect to the Blob Storage
  //
  const BLOB_SERVICE_ACCOUNT_NAME = account

  const defaultAzureCredential = new DefaultAzureCredential()

  return new BlobServiceClient(
  `https://${BLOB_SERVICE_ACCOUNT_NAME}.blob.core.windows.net`,
  defaultAzureCredential
  )
}

//
// Returns the raw file of UTF-8 text.
//
const read = async ({
  account = '',
  container = '',
  filename = ''
}) => {
  if (!account) return { err: new Error(ERRORS.missing.account) }
  if (!container) return { err: new Error(ERRORS.missing.container) }
  if (!filename) return { err: new Error(ERRORS.missing.filename) }

  try {
    const blobServiceClient = createBlobServiceClient(account)
    //
    // Now, fetch the file from blob storage file
    //
    const containerClient = blobServiceClient.getContainerClient(container)

    const blobClient = containerClient.getBlobClient(filename)
    const { readableStreamBody } = await blobClient.download()

    const data = await streamToString(readableStreamBody)

    return { data }
  } catch (err) {
    return { err }
  }
}

//
// Content is expected to be UTF-8 string data, not binary.
//
const write = async ({
  account = '',
  container = '',
  filename = '',
  content = ''
}) => {
  if (!account) return { err: new Error(ERRORS.missing.account) }
  if (!container) return { err: new Error(ERRORS.missing.container) }
  if (!filename) return { err: new Error(ERRORS.missing.filename) }
  if (!content) return { err: new Error(ERRORS.missing.content) }

  try {
    const blobServiceClient = createBlobServiceClient(account)
    const containerClient = blobServiceClient.getContainerClient(container)
    const blockBlobClient = containerClient.getBlockBlobClient(filename)

    const { requestId = '' } = await blockBlobClient
      .upload(content, content.length)

    if (!requestId) {
      return {
        err: new Error('Failed to confirm uploading of file, ' +
        `${filename} to blob storage. No requestId was returned. Try again.`)
      }
    }

    return { data: requestId }
  } catch (err) {
    return { err }
  }
}

module.exports = { read, write }
