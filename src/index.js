const { DefaultAzureCredential } = require('@azure/identity')
const { BlobServiceClient } = require('@azure/storage-blob')

const ERRORS = {
  missing: {
    account: 'Missing `account` parameter.',
    container: 'Missing `container` parameter.',
    content: 'Missing `content` parameter.',
    destination: 'Missing `destination` parameter.',
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

const getStorageBaseUrl = (account = '') => {
  return `https://${account}.blob.core.windows.net`
}

const createBlobServiceClient = (account = '') => {
  //
  // Authenticate and then connect to the Blob Storage
  //
  const creds = new DefaultAzureCredential()

  return new BlobServiceClient(getStorageBaseUrl(account), creds)
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
// Move a file from a container to another destination within the same
// container and then delete the original file (destructive).
//
const move = async ({
  account = '',
  destination = null,
  container = '',
  filename = ''
}) => {
  if (!account) return { err: new Error(ERRORS.missing.account) }
  if (!container) return { err: new Error(ERRORS.missing.container) }
  if (!filename) return { err: new Error(ERRORS.missing.filename) }

  if (!destination) {
    return { err: new Error(ERRORS.missing.destination) }
  }
  if (Array.isArray(destination) && !destination.length) {
    return { err: new Error(ERRORS.missing.destination) }
  }

  const results = []
  let moved = null

  try {
    const blobServiceClient = createBlobServiceClient(account)
    //
    // Now, fetch the file from blob storage file
    //
    const containerClient = blobServiceClient.getContainerClient(container)

    destination = [destination, filename].join('/')

    const source = [
      getStorageBaseUrl(account),
      container,
      filename
    ].join('/')

    const blobClient = containerClient.getBlobClient(destination)

    moved = await blobClient.syncCopyFromURL(source)

    results.push(moved)

    //
    // Now delete the file by creating a new blob client for the
    // original file.
    //
    {
      const { err, data } = await del({ account, container, filename })
      if (err) return { err }
      results.push(data)
    }

    return { data: results }
  } catch (err) {
    return { err }
  }
}

//
// Copies a file to a destination folder within the same container.
// Keeps original file in tact (nondestructive).
//
const copy = async ({
  account = '',
  destination = '',
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

    destination = [destination, filename].join('/')

    const source = [
      getStorageBaseUrl(account),
      container,
      filename
    ].join('/')

    const blobClient = containerClient.getBlobClient(destination)

    let copy = null
    try {
      copy = await blobClient.syncCopyFromURL(source)
    } catch (err) {
      return { err }
    }

    return { data: copy }
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

//
// Delete a blob within a container (destructive).
//
const del = async ({
  account = '',
  container = '',
  filename = ''
}) => {
  if (!account) return { err: new Error(ERRORS.missing.account) }
  if (!container) return { err: new Error(ERRORS.missing.container) }
  if (!filename) return { err: new Error(ERRORS.missing.filename) }
  let removed = null

  try {
    const blobServiceClient = createBlobServiceClient(account)

    const containerClient = blobServiceClient.getContainerClient(container)

    const blobClient = containerClient.getBlobClient(filename)

    removed = await blobClient.delete()

    return { data: removed }
  } catch (err) {
    return { err }
  }
}

//
// Get the list of contents (files) of a container directory
// Returns an array of filenames
//
const listContainers = async ({
  account = '',
  container = '',
  maxPageSize = 20
}) => {
  if (!account) return { err: new Error(ERRORS.missing.account) }
  if (!container) return { err: new Error(ERRORS.missing.container) }

  try {
    const blobServiceClient = createBlobServiceClient(account)

    const data = []

    for await (const response of blobServiceClient
      .listContainers()
      .byPage({ maxPageSize })) {
      if (response.containerItems) {
        for (const container of response.containerItems) {
          data.push(container)
        }
      }
    } return { data }
  } catch (err) {
    return { err }
  }
}

//
// Returns entire list of blob objects as an array
//
const listFiles = async ({
  account = '',
  container = ''
}) => {
  if (!account) return { err: new Error(ERRORS.missing.account) }
  if (!container) return { err: new Error(ERRORS.missing.container) }

  try {
    const blobServiceClient = createBlobServiceClient(account)
    const containerClient = blobServiceClient.getContainerClient(container)

    const data = []

    for await (const blob of containerClient.listBlobsFlat()) {
      data.push(blob)
    }
    return { data }
  } catch (err) {
    return { err }
  }
}

//
// Returns entire list of blob filenames as an array
//
const listFilesByName = async ({
  account = '',
  container = ''
}) => {
  if (!account) return { err: new Error(ERRORS.missing.account) }
  if (!container) return { err: new Error(ERRORS.missing.container) }

  try {
    const blobServiceClient = createBlobServiceClient(account)
    const containerClient = blobServiceClient.getContainerClient(container)

    const data = []

    for await (const blob of containerClient.listBlobsFlat()) {
      data.push(blob.name)
    }
    return { data }
  } catch (err) {
    return { err }
  }
}

module.exports = {
  copy,
  del,
  listContainers,
  listFiles,
  listFilesByName,
  move,
  read,
  write
}
