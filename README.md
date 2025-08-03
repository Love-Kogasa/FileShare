项目施工中！  
当前版本为 1.0-beta 版本，可能存在较多错误  
## V-FileShare
~~本项目原计划命名为FileShare，但是这个名字吧，不太好，故更名为V-FileShare~~  
同时支持 服务器环境/ServerLess，基于nodejs+fastify编写，易于操作 的开源免费下载站模板  
无论DaLao还是这方面的新人都可以较为简单的搭建自己的下载站  
<!--如果您不熟悉Nodejs以及建站相关内容，请[点我](#免费搭建文件下载站)  -->

## 本地启动
克隆本仓库
```bash
git clone https://github.com/Love-Kogasa/FileShare
cd FileShare
```
安装依赖
```bash
npm i
```
安装依赖(Termux SD卡目录)
```bash
npm i --no-bin-links
```
启动
```bash
npm run server
```
启动(Vercel ServerLess测试)
```bash
npm run serverless
```

## 下载站配置
由于最初设计遗留问题，V-FileShare使用更易于编写的Ini作为配置文件格式  
(config.ini)
```ini
[page]
avatar  =   /public/avatar.jpg # 头像，下载站图标
title   =   Love-Kogasa的文件分享站 w/ # 下载站名称，不要太长，像我这样的就比较长了
description =   Love-Kogasa的文件分享站<br>本站为项目demo站！！！ # 介绍，请不要使用除<br><hr><img>外的html标签
author  =   Love-Kogasa # 网站所属者
keywords    = # 网站关键字
no-readme   =   README未找到˃ʍ˂ # 当页面没有README(介绍)时显示的内容，支持markdown文本
empty-folder    =   空空如也 (ー_ー)!! # 当目录里没有内容时显示的内容
no-file =   文件未找到 ˃ʍ˂ # 当用户试图请求的路径没有文件时显示的内容
no-preview  =   文件无法预览，请到本地再打开 ˃ʍ˂ # 当文件无法预览是显示的内容(网络目录文件均不支持预览)
favicon =   /public/avatar.jpg # 网站的图标
default-visitor-number  =   114514 # 当人数统计未生效时显示的内容

; 样式信息，内容也可以是css函数
font    =   sans-serif # 下载站字体
hightlight-theme    =   tokyo-night-light # highlight.js 使用的主题
bar-color   =   \#8200FF # 网站标题栏背景色(用于标题栏，底栏以及文件icon背景以及按钮)
bar-color-alpha =   \#8200FF44 # 网站标题栏透明背景色(用于介绍栏背景)
bar-font-color-alpha =   \#FFF # 上面对应的颜色
bar-shadow  =   \#D8AFFF55 #标题栏阴影
bar-font-color  =   \#FFF # 标题栏文字颜色
background-color    =   \#D2F0FF # 页面背景
background-image    =   url( "/public/bg.jpg" ) # 页面背景图，会覆盖color，没有的话换成none就行
font-color  =   \#000 # 页面默认文字颜色
board-background-color  =   \#FFFFFF99 # 展示板背景色
board-text-color    =   \#000 # 展示栏文字颜色
comment-color   =   \#CCC # 文件名注释颜色
menu-color   =   \#C8B6FF # 菜单(导航侧栏)颜色
link-color  =   \#000 # 链接颜色
link-visited-color  =   \#000 # 链接访问过显示的颜色

[footer]
; 底栏图标列表，添加格式 label = url，建议弄1-3个
bilibili   =   https://space.bilibili.com/2112163692 # 将这里的2112163692换成你的bilibili uid就可以了
github =   https://github.com/Love-Kogasa
blog   =   https://lovekogasa.lapis-net.top/

[menu]
; 格式同底栏，为了美观，无论如何下载站都会加载一个本站的链接
example =   https://lapis-net.top/

[sakana-widget]
enable  =   1 # 这个功能暂时有一些小问题，建议关闭
character   =   chisato # 内置角色或custom，详见 https://github.com/dsrkafuu/sakana-widget/blob/main/README.zh.md
img = # custom 使用的图片url，使用custom必须加载这个

[data]
files   =   /files # 下载站根目录对应的文件夹，在public文件夹下
domain  =   http://fileshare.lapis-net.top # 域名，目前仅用于生成sitemap
readme  =   readme.md # Vercel这里要改成别的(如readthis.md)，要不访问不到文件，详见下文vercel部署的注意事项

```

## 使用 Vercel 免费部署
v-fileshare 支持使用Vercel进行部署  
Vercel的hobby计划提供的2c2g完全足够，这里需要一些要注意.  
### 关于README的问题
Vercel不能正确的处理名字为README.md文件的文件存放目录，这里有两种对应方案来加载README.md
* (推荐)更改README文件名称，详见上文配置
* (不推荐)在目录下创建一个网络文件(.fsurl)指向 https://域名/files/路径/README.md  
其中files对应上文data/files的值

### 对于大文件限制
Vercel不适合存储超大文件，详见Vercel相关限制 https://vercel.com/docs/limits  
您可以使用任意静态文件托管服务来存储文件(详见: [网络目录](#网络目录))，不过请注意对应平台的相关限制  
如果您使用的静态托管服务支持自定义域名，请在域名处启用代理服务，不用在网络目录的配置中启用proxy选项

### 现在开始
如果你已经注册好Vercel账户和Github账户，那么您可以直接点击以下链接部署您的项目
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Love-Kogasa/FileShare)

## 借物表
(候补)

## 网络目录
(候补)
### V-FileShare API
(候补)
### Static
(候补)

## 对于啥也不会的小白
(候补)
### 几种免费域名的获取渠道
(候补)

## 页面开发
(候补)