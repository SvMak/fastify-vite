const {
  path: {
    resolve
  },
  vite: {
    createServer
  },
  middie,
  staticPlugin,
  fp
} = require('./deps')

const { build } = require('./build')
<<<<<<< HEAD
const { getOptions, patchOptions } = require('./options')

// const vueRenderer = require('./vue')
const reactRenderer = require('./react')
=======
const { processOptions } = require('./options')
>>>>>>> eff058a2c157c5555278ea0d9b85a15a579acf81

async function fastifyVite (fastify, options) {
  // Run options through Vite to get all Vite defaults taking vite.config.js
  // into account and ensuring options.root and options.vite.root are the same
  try {
    options = await processOptions(options)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }

  const { getHandler, getRenderGetter } = options.renderer

  const { getHandler, getRenderGetter } = options.renderer

  // We'll want access to this later
  let handler
  let vite

  // Setup appropriate Vite route handler
  // For dev you get more detailed logging and sautoreload
  if (options.dev) {
    vite = await createServer({
      server: { middlewareMode: true },
      ...options.vite
    })
    await fastify.register(middie)
    fastify.use(vite.middlewares)
    const getRender = getRenderGetter(options)
    handler = getHandler(options, getRender, vite)
  } else {
    const { assetsDir } = options.vite.build
    await fastify.register(staticPlugin, {
      root: resolve(options.distDir, `client/${assetsDir}`),
      prefix: `/${assetsDir}`
    })
    const getRender = getRenderGetter(options)
    handler = getHandler(options, getRender)
  }

  // Sets fastify.vite.get() helper which uses
  // a wrapper for setting a route with a data() handler
  fastify.decorate('vite', {
    handler,
    options,
    global: undefined,
    devServer: vite,
    get (url, { data, ...routeOptions } = {}) {
      return this.route(url, { data, method: 'GET', ...routeOptions })
    },
    post (url, { data, method, ...routeOptions } = {}) {
      return this.route(url, { data, method: 'GET', ...routeOptions })
    },
    route (url, { data, method, ...routeOptions } = {}) {
      let preHandler
      if (data) {
        preHandler = async function (req, reply) {
          req[options.hydration.data] = await data.call(this, req, reply)
        }
      }
      fastify.get(`/-/data${url}`, async function (req, reply) {
        return data.call(this, req, reply)
      })
      fastify.route({
        method,
        url,
        preHandler,
        handler,
        ...routeOptions
      })
    }
  })
  fastify.addHook('onReady', () => {
    // Pre-initialize request decorator for better performance
    // This actually safely adds things to Request.prototype
    fastify.decorateRequest(options.hydration.global, { getter: () => fastify.vite.global })
    fastify.decorateRequest(options.hydration.data, null)
    if (options.api) {
      fastify.decorateRequest('api', fastify.api)
    }
  })
}

// fastifyVite.vue = vueRenderer
fastifyVite.react = reactRenderer

fastifyVite.app = async function appExport (main, serve) {
  const fastify = await main()
  if (process.argv.length > 2 && process.argv[2] === 'build') {
    build(fastify.vite.options)
  } else {
    serve(fastify)
  }
}

Object.defineProperty(fastifyVite, 'vue', {
  get () {
    return require('./renderers/vue')
  }
})

module.exports = fp(fastifyVite)
