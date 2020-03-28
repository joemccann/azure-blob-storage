require('dotenv').config()
const test = require('tape')
const pkg = require('../package.json')

const {
  del,
  copy,
  move,
  read,
  write,
  listContainers,
  listFiles,
  listFilesByName
} = require('../src/')

const container = process.env.AZURE_STORAGE_CONTAINER
const account = process.env.BLOB_SERVICE_ACCOUNT_NAME

test('sanity', t => {
  t.ok(true)
  t.end()
})

test('pass - write blob storage file', async t => {
  const content = JSON.stringify(pkg)
  const { err, data } = await write({
    account,
    content,
    container,
    filename: 'pkg.json'
  })
  t.ok(!err)
  t.ok(data)
  t.equals(data.length, 36)
  t.end()
})

test('pass - copy file to subdirectory within container', async t => {
  const { err, data } = await copy({
    account,
    destination: 'archive',
    container,
    filename: 'pkg.json'
  })
  const { errorCode, copyStatus } = data
  t.equals(copyStatus, 'success')
  t.ok(!errorCode)
  t.ok(!err)
  t.ok(data)
  t.end()
})

test('fail - copy file to subdirectory within container', async t => {
  const { err, data } = await copy({
    account,
    destination: 'fail',
    container,
    filename: 'fail.json'
  })
  t.ok(err)
  t.ok(!data)
  t.equals(err.statusCode, 404)
  t.end()
})

test('pass - move file to subdirectory within container', async t => {
  const { err, data } = await move({
    account,
    destination: 'archive',
    container,
    filename: 'pkg.json'
  })
  const [moved, removed] = data
  t.equals(moved.copyStatus, 'success')
  t.ok(!removed.errorCode)
  t.ok(!err)
  t.ok(data)
  t.end()
})

test('fail - move file to subdirectory within container', async t => {
  const { err, data } = await move({
    account,
    destination: 'fail',
    container,
    filename: 'fail.json'
  })
  t.ok(err)
  t.ok(!data)
  t.equals(err.statusCode, 404)
  t.end()
})

test('pass - write blob storage file again', async t => {
  const content = JSON.stringify(pkg)
  const { err, data } = await write({
    account,
    content,
    container,
    filename: 'pkg.json'
  })
  t.ok(!err)
  t.ok(data)
  t.equals(data.length, 36)
  t.end()
})

test('pass - delete file', async t => {
  const { err, data } = await del({
    account,
    container,
    filename: 'pkg.json'
  })
  t.ok(data)
  t.ok(!data.errorCode)
  t.ok(!err)
  t.end()
})

test('fail - delete file', async t => {
  const { err, data } = await del({
    account,
    container,
    filename: 'pkg.json'
  })
  t.ok(err)
  t.ok(!data)
  t.equals(err.statusCode, 404)
  t.end()
})

test('pass - write file to subdirectory within the container',
  async t => {
    const content = JSON.stringify(pkg)
    const { err, data } = await write({
      account,
      content,
      container,
      filename: 'archive/pkg-subdirectory-test.json'
    })
    t.ok(!err)
    t.ok(data)
    t.equals(data.length, 36)
    t.end()
  })

test('fail - write file to subdirectory within the container',
  async t => {
    const content = JSON.stringify(pkg)
    const { err, data } = await write({
      account,
      content,
      container: 'fail',
      filename: 'fail/pkg-subdirectory-test.json'
    })
    t.ok(err)
    t.ok(!data)
    t.equals(err.statusCode, 404)
    t.end()
  })

test('pass - list containers', async t => {
  const { err, data } = await listContainers({
    account,
    container
  })
  t.ok(!err)
  t.ok(data)
  t.ok(Array.isArray(data))
  t.end()
})

test('pass - list files', async t => {
  const { err, data } = await listFiles({
    account,
    container
  })
  t.ok(!err)
  t.ok(data)
  t.ok(Array.isArray(data))
  t.end()
})

test('pass - list files by name', async t => {
  const { err, data } = await listFilesByName({
    account,
    container
  })
  t.ok(!err)
  t.ok(data)
  t.ok(Array.isArray(data))
  t.end()
})

test('fail - list containers', async t => {
  const { err, data } = await listContainers({
    account: 'fail',
    container: 'fail'
  })
  t.ok(err)
  t.ok(!data)
  t.equals(err.statusCode, 403)
  t.end()
})

test('fail - list files', async t => {
  const { err, data } = await listFiles({
    account: 'fail',
    container: 'fail'
  })
  t.ok(err)
  t.ok(!data)
  t.equals(err.statusCode, 403)
  t.end()
})

test('fail - list files by name', async t => {
  const { err, data } = await listFilesByName({
    account,
    container: 'fail'
  })
  t.ok(err)
  t.ok(!data)
  t.equals(err.statusCode, 404)
  t.end()
})

test('pass - write blob storage file for read', async t => {
  const content = JSON.stringify(pkg)
  const { err, data } = await write({
    account,
    content,
    container,
    filename: 'pkg.json'
  })
  t.ok(!err)
  t.ok(data)
  t.equals(data.length, 36)
  t.end()
})

test('pass - read blob storage file', async t => {
  const { err, data } = await read({
    account,
    container,
    filename: 'pkg.json'
  })
  t.ok(!err)
  t.ok(data)
  t.end()
})

test('fail - read blob storage file', async t => {
  const { err, data } = await read({
    account,
    container,
    filename: 'fail.json'
  })
  t.ok(err)
  t.ok(!data)
  t.equals(err.message, 'Unexpected status code: 404')
  t.end()
})

test('fail - write blob storage', async t => {
  const content = JSON.stringify(pkg)
  const { err, data } = await write({
    account,
    content,
    container: 'fail',
    filename: 'fail.json'
  })
  t.ok(err)
  t.ok(!data)
  t.true(err.response.parsedBody.message
    .includes('The specified container does not exist'))
  t.end()
})
