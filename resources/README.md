# 离线行政区资源

本目录保存城市热点图需要的固定行政区资源。渲染时从仓库读取这些文件；不得在运行时下载远程地图、调用地图瓦片，或让模型按城市名称临时拼接边界。

## 当前资源

| 文件 | 用途 | 规模 | 关键字段 |
|---|---|---:|---|
| `administrative-codes/guangdong-city-codes.json` | 广东省地级市编码和名称映射 | 21 个城市、42 个名称（含“市”后缀与查询常见简称） | `cities[].code`、`cities[].name`、`cities[].aliases[]`、`cityNameToCode` |
| `boundaries/guangdong-440000-city.geojson` | 广东省地级市离线边界 | 21 个 `MultiPolygon` feature，约 188 KiB | `properties.adcode`、`properties.name`、`geometry` |

城市编码使用六位 `adcode` 字符串，例如 `440100`（广州）和 `440300`（深圳）。查询返回的 `city` 必须先通过 `cityNameToCode` 转成编码，再与 GeoJSON 的 `properties.adcode` 连接；名称无法匹配或一个名称对应多个编码时，图表必须标记为未评估，不能猜测。

## 来源和发布限制

边界文件是项目已有 `reports/guangdong_440000_full.geojson` 的离线副本。该文件的 21 个 feature 均为 `level=city`、`parent.adcode=440000`，原文件 SHA-256 为 `209ad617a296b154c4fd0828180b2a9ab2b270044990ab34e72a344ce913c8c7`。历史报告曾将这份边界归因于“阿里云 DataV 行政区 GeoJSON”；当前资源保留该来源线索，但**许可状态仍待核实**，在对外发布共享 Skill 前必须完成归属和许可复核。

资源只覆盖广东省省内城市，不能被当作全国边界。新增省份或全国边界时，应为每个资源提供标准编码范围、来源、获取日期、文件校验和及许可状态，并通过同样的资源校验脚本。

## 校验

在本 Skill 目录执行：

```bash
node scripts/validate-resources.mjs
```

脚本会检查：编码是否为六位数字、城市名称映射是否无歧义、映射城市与 GeoJSON feature 是否一一对应、边界 feature 是否为 `MultiPolygon`，以及资源文件是否可被 JSON 解析。
