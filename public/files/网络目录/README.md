## 使用FileShare分享网络文件
在本项目中，每一个.fsurl文件都代表着一个网络文件，示例  
直接从原链接下载文件(跳转)  
```
https://example.com
```
通过代理下载文件  
*并不是所有网络文件都支持代理下载，出于安全考虑，本项目仅允许代理fsurl中存在的文件！*  
```
@https://example.com
```
自定义下载请求(自定义下载请求仅支持代理下载)  
```js
[subject]
url     =   https://example.com
description =   网络文件
method  =   GET
json    =   0

[headers]
content-type    =   text/plain
```