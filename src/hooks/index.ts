import Koa from 'koa'
import views from 'koa-views'
import serve from 'koa-static'
import Router from 'koa-router'

import open from 'open'
import boxen from 'boxen'
import _ from 'lodash'
import chalk from 'chalk'

import axios from 'axios'

/**
 * 实现钩子： read_define_format
 * 定义支持的格式
 */
export const hook_read_define_format = {
  wechat: '基于 Markdown 的微信公众号文章编辑器'
}

export const hook_read_format = {
  wechat: async ({ title, markdown, converted, argv }) => {
    const app = new Koa()
    var router = new Router();

    markdown = markdown || '# ' // 如果为空会有默认帮助文档

    router.get('/proxy/(.*)', async (ctx, next) => {
      const proxyUrl = ctx.request.url.substring(7)
      return axios({
        url: proxyUrl,
        responseType: 'stream'
      }).then(response => {
        ctx.type = response.headers['content-type']
        ctx.body = response.data
      })
    });

    app.use(router.routes())

    app.use(views(__dirname + '/../../views', {
      map: {
        html: 'nunjucks',
        extension: 'html'
      }
    }));

    app.use(serve(__dirname + '/../../assets'))

    app.use(async function (ctx) {
      return await ctx.render('index.html', {
        title, markdown
      });
    });

    // 清除终端，copy from package: react-dev-utils
    function clearConsole() {
      process.stdout.write(
        process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H'
      );
    }

    if (argv.clearConsole) {
      process.stdout.isTTY && clearConsole()
    }

    const box: any = ['Read the article on your default browser...', '']
    box.push(chalk.bold(`Local: `) + chalk.green(argv.localhost))
    if (argv.nethost) {
      box.push(chalk.bold(`WLAN: `) + chalk.green(argv.nethost))
    }

    app.listen(argv.port)
    if (argv.openBrowser) {
      await open(argv.nethost || argv.localhost)
    }
    console.log(boxen(box.join('\n'), {
      margin: 1,
      padding: 1,
      borderColor: 'green'
    }))
  }
}