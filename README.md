# Azure Storage Blob

🗳 An opinionated and tiny, read/write library for Azure Blob Storage.

## Usage

```sh
npm i -S joemccann/azure-blob-storage
```

Create a `.env` file in your app with the following parameters,
replacing `XXX` with the appropriate values:

```sh
AZURE_TENANT_ID=XXX
AZURE_CLIENT_ID=XXX
AZURE_CLIENT_SECRET=XXX
AZURE_STORAGE_CONTAINER=XXX
BLOB_SERVICE_ACCOUNT_NAME=XXX
```

If you don't know where to obtain these values in Azure, look at
the [AZURE.md](/AZURE.md) document.

And be sure to include the `dotenv` configuration wherever
you are using this library in your Node app.

```js
require('dotenv').config()

const container = process.env.AZURE_STORAGE_CONTAINER
const account = process.env.BLOB_SERVICE_ACCOUNT_NAME
```

To read a file:

```js
const { err, data } = await read({
  account,
  container,
  filename: 'pkg.json'
})

if (err) return { err }

const json = JSON.parse(data)
```

To write a file:

```js
const content = JSON.stringify({foo: 'bar', baz: 42})
const { err, data } = await write({
  account,
  content,
  container,
  filename: 'my-file.json'
})

if (err) return { err }

console.log(data) // '41b30145-501e-0089-636a-00cb08000000'
```

## Tests

> Note: you will need a `.env` file to run the tests and the tests will read
and write to your Azure Storage account.

```sh
npm i -D
npm test
```

## License

MIT
