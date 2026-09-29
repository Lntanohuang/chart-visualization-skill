# City heatmap chart

Use for city or region intensity distributions when standard geographic codes and offline boundary data are available.

## Required structure

```html
<figure data-chart-skill="heatmap-chart" data-chart-id="CH1">
  <svg viewBox="0 0 960 640" role="img" aria-labelledby="CH1-title CH1-desc">
    <title id="CH1-title">中国 Java 后端在招岗位城市分布</title>
    <desc id="CH1-desc">按城市展示经过同一岗位筛选口径的岗位数量，颜色越深表示数量越多。</desc>
    <!-- boundary paths, one per standard geographic code -->
  </svg>
  <figcaption>来源、查询日期、快照日期、城市字段、岗位筛选、分母和单位。</figcaption>
</figure>
```

## Rules

- Use a single continuous color scale for the same query scope. Zero or missing values use a neutral fill; do not imply zero when the city was not covered.
- Do not use bubbles or circle overlays. Use region fill and a legend; label only the most relevant cities to avoid clutter.
- China-only condition: include this section when the user's target location is in China and city-level data is available. Omit it for an overseas target. For an unknown target location, ask or mark it unassessed.
- Use standard Chinese administrative codes and an offline boundary file. The report should state whether the map covers all China, a province, or only cities returned by the query.
- If the report protocol limits data rows, keep the map's metric payload to the top 20 cities plus “其他”; the SVG may still show covered boundary regions in neutral color.
- A map is not evidence of hiring or employment outcomes. Describe it as the distribution of job records in the queried database.
