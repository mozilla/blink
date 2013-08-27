{
  "query": "select * from servers limit 10",
 
  "name": "Popular Servers",
  "width": 480,
  "height": 200,
  "padding": {"top": 10, "left": 300, "bottom": 20, "right": 10},
  "data": [
    {
      "name": "documents",
      "-transform":[{"type": "filter", "test": "d.data.server_name"}]
    }
    ],
  "scales": [
    {"name":"y", "type":"ordinal", "range":"height", "domain":{"data":"documents", "field":"data.server_name"}},
    {"name":"x",  "range":"width", "nice":true, "domain":{"data":"documents", "field":"data.count"}}
  ],
  "axes": [
    {"type":"x", "scale":"x"},
    {"type":"y", "scale":"y"}
  ],
  "marks": [
    {
      "type": "rect",
      "from": {"data":"documents"},
      "properties": {
        "enter": {
          "x": {"scale":"x", "field":"data.count"},
          "x2": {"scale":"y", "value":0},

          
          "y": {"scale":"y", "field":"data.server_name"},
          "height": {"scale":"y", "band":true, "offset":-1}
          
        },
        "update": { "fill": {"value":"steelblue"} },
        "hover": { "fill": {"value":"red"} }
      }
    }
  ]
}