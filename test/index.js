require('dotenv').config()
const test = require('tape')
const pkg = require('../package.json')

const { read, write } = require('../src/')

const container = process.env.AZURE_STORAGE_CONTAINER
const account = process.env.BLOB_SERVICE_ACCOUNT_NAME

test('sanity', t => {
  t.ok(true)
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
