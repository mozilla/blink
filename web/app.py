import os
import sys
from functools import partial
from itertools import islice, chain
import json

from discodb import DiscoDB
import boto
from flask import (
  Flask, 
  render_template, 
  make_response,
  request,  
  jsonify
)

from . import tasks

app = Flask(__name__)




# expects list to be sorted
def slice(items, size, dir, label="Other"):
  if dir == "ASC":
    i = iter(items)
  elif dir == "DESC":
    i = reversed(items)
  else:
    raise ValueError("dir must be ASC|DESC")

  for item in islice(i, size):
    yield item
  
  other = sum(item[1] for item in i)
  if other > 0:
    yield label, other


def top(items, size=5):
  return slice(items, size, "DESC")

def bottom(items, size=5):
  return slice(items, size, "ASC")


def sort(iter, col, dir="ASC"):
  if dir == "ASC":
    reversed = False
  elif dir == "DESC":
    reversed = True

  return sorted(iter, key=lambda r:r[col], reverse=reversed)

def execute(q_str, col=1):
  results = tasks.count.delay(q_str).get()
  return sort(results, col=col)

def ensure_dir(path):
  dirname = os.path.dirname(path)
  if not os.path.exists(dirname):
    os.makedirs(dirname)




@app.template_filter('value')
def value(k):
  return k.split(':',1)[-1]

@app.template_filter('commas')
def commas(val):
  return "{:,d}".format(val)

@app.route('/')
def index():
  q = request.args.get('q')
  if q:
    results = execute(q)
  else:
    results = []
    q = "*feature"

  return render_template(
    'index.html',
    q = q,
    features = execute("*feature", col=0),
    results = results,
    sort = sort,
    top = top,
    bottom = bottom
  )

@app.route('/vega')
def vega():
  return render_template('vega.html')

@app.route('/spec/')
@app.route('/spec/<path:query>')
def spec(query='*feature'):
  """Generate a vega spec file from query"""

  table = dict(
    name="table",
    values =  [
      dict(x=x, y=y) 
      for x,y in
      execute(query)
    ]
  )
   

  response =  make_response(render_template(
    'spec.json', 
    data = json.dumps([table])
  ))
  response.headers['content-type'] = "application/json"
  return response
  


@app.route('/json/')
@app.route('/json/<path:query>')
def json_endpoint(query='*feature'):

  results =  execute(query)
  return jsonify(
    name=query,
    values=[dict(x=x, y=y) for x,y in results]
  )


if __name__ == '__main__':
    app.run(
      debug=True
    )