#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const BUCKET = 'velzo-smps'

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')
  process.exit(1)
}

function uploadFile(filePath, objectPath) {
  return new Promise((resolve, reject) => {
    const fileContent = fs.readFileSync(filePath)
    const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`
    const urlObj = new URL(url)
    const isHttps = urlObj.protocol === 'https:'
    const client = isHttps ? https : http

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/octet-stream',
        'x-upsert': 'true',
        'Content-Length': fileContent.length,
      },
    }

    const req = client.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log(`✓ Uploaded: ${objectPath}`)
          resolve()
        } else {
          console.error(`✗ Failed: ${objectPath} (${res.statusCode})`)
          console.error(`  Response: ${data}`)
          reject(new Error(`HTTP ${res.statusCode}`))
        }
      })
    })

    req.on('error', (error) => {
      console.error(`✗ Network error: ${objectPath}`, error.message)
      reject(error)
    })

    req.write(fileContent)
    req.end()
  })
}

function walkDir(dir, baseDir = dir) {
  const files = fs.readdirSync(dir)
  const promises = []

  for (const file of files) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      promises.push(...walkDir(fullPath, baseDir))
    } else {
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/')
      promises.push(uploadFile(fullPath, relativePath))
    }
  }

  return promises
}

async function main() {
  try {
    const distPath = path.join(process.cwd(), 'dist')
    if (!fs.existsSync(distPath)) {
      console.error('❌ dist folder not found. Run "npm run build" first.')
      process.exit(1)
    }

    console.log('🚀 Starting upload to Supabase Storage...')
    const promises = walkDir(distPath)
    await Promise.all(promises)
    console.log('✅ All files uploaded successfully!')
  } catch (error) {
    console.error('❌ Upload failed:', error.message)
    process.exit(1)
  }
}

main()

