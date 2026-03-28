import { loadEnv, defineConfig } from '@medusajs/framework/utils'
import { Modules } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: {
    [Modules.FILE]: {
      resolve: "@medusajs/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/file-s3",
            id: "s3",
            options: {
              file_url: process.env.FILE_S3_URL,
              access_key_id: process.env.FILE_S3_ACCESS_KEY_ID,
              secret_access_key: process.env.FILE_S3_SECRET_ACCESS_KEY,
              region: process.env.FILE_S3_REGION || "auto",
              bucket: process.env.FILE_S3_BUCKET,
              endpoint: process.env.FILE_S3_ENDPOINT,
              forcePathStyle: true,
            },
          },
        ],
      },
    },
  },
})
