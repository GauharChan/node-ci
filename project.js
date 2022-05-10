const fs = require("fs");
const json2xls = require("json2xls");
const originData = require("./projectData");



function getTemplate(item) {
  return {
    '项目群组': item.group || '',
    '项目名称': item.name,
    '项目描述': item.description,
    '代码仓库地址(内网)': `http://192.xxx.x.xxx${item.relative_path}`,
    '代码仓库地址(外网)': `http://xxx.xxx.com${item.relative_path}`,
    '搬迁时间': item.created_at.slice(0, 10),
  }
}

const arr = originData.map((item, index) => {
  const children = item.children;
  // 分组
  if(children) {
    return children.map((child, index) => {
      child.group = item.name
      return getTemplate(child);
    })
  } else {
    return getTemplate(item)
  }
})

const excelData = arr.flat();
const xls = json2xls(excelData);
fs.writeFileSync(`./前端仓库迁移汇总.xlsx`, xls, "binary");