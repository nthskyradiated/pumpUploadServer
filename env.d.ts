
declare global {
    declare namespace NodeJS {
        interface ProcessEnv {
            PORT: number
            NODE_ENV: 'dev' | 'prod'
        }
      }
}

  export {}