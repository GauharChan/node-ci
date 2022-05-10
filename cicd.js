const fs = require("fs");
const data = require("./dataCI");
const child_process = require("child_process");
const json2xls = require("json2xls");

function getContent(item) {
  return `variables:
  GIT_STRATEGY: clone

stages:
  - deploy

deploy:
  stage: deploy
  tags:
    - ${item.runner}
  script:
    - npm install --unsafe-perm=true --allow-root
    - rm -rf ./dist
    - >${item.测试服务器路径 ? `\n      if [ "$CI_BUILD_REF_NAME" == "test" ]; then
        echo 'test branch'
        ${item.测试环境自定义命令 || 'npm run build:test'}
        scp -r ./dist/* ${item.测试服务器路径}${item.开发服务器路径 ? '' : '\n      fi'}` : ''}${item.开发服务器路径 ? `${item.测试服务器路径 ? '\n      elif' : '\n      if'} [ "$CI_BUILD_REF_NAME" == "dev" ]; then
        echo 'dev branch'
        ${item.开发环境自定义命令 || 'npm run build:dev'}
        scp -r ./dist/* ${item.开发服务器路径}
      fi` : ''}${item.机器人地址 ? `\n    - curl ${item.机器人地址}` : ''}
  except:
    - master
`
}


const newDirName = '生成好的配置文件';
const configList = []
// 删除文件夹
child_process.exec(`rm -rf ./${newDirName}`, () => {
  fs.mkdir(`./${newDirName}`, () => {
    const groups = [... new Set(data.map(item => item.群组名))]
    // 按群组生成文件夹
    groups.forEach(item => fs.mkdirSync(`./${newDirName}/${item}`))
    
    data.forEach(item => {
      const ymlPath = `./${newDirName}/${item.群组名}/.${item.项目名称}-gitlab-ci.yml`
      const ymlName = `${item.群组名}/.${item.项目名称}-gitlab-ci.yml`
      fs.writeFile(ymlPath, getContent(item), 'utf-8', (error) => {
        if (error) console.log(error)
      })
      configList.push({
        '项目名称': item.项目名称,
        '配置文件地址': `http://192.168.8.244/honedu/sre/config/-/raw/main/frontend/${ymlName}`
      })
    })
    toExcel(configList)
  });
});
// 生成对应配置文件网络路径的excel
function toExcel(data) {
  const xls = json2xls(data);
  fs.writeFileSync(`./CICD配置网址.xlsx`, xls, "binary");
}
