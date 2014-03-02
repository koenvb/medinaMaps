from google.appengine.ext import ndb
import modelx
from uuid import uuid4


class Base(ndb.Model, modelx.BaseX):
  created = ndb.DateTimeProperty(auto_now_add=True)
  modified = ndb.DateTimeProperty(auto_now=True)
  _PROPERTIES = set([
      'key', 'id', 'created', 'modified', 'created_ago', 'modified_ago',
    ])


class Config(Base, modelx.ConfigX):
  analytics_id = ndb.StringProperty(default='UA-41123900-1')
  brand_name = ndb.StringProperty(default='Medina maps')
  feedback_email = ndb.StringProperty(default='')
  flask_secret_key = ndb.StringProperty(default=str(uuid4()).replace('-', ''))
  _PROPERTIES = Base._PROPERTIES.union(set([
      'analytics_id',
      'brand_name',
      'feedback_email',
      'flask_secret_key',
    ]))


class User(Base, modelx.UserX):
  name = ndb.StringProperty(indexed=True, required=True)
  username = ndb.StringProperty(indexed=True, required=True)
  email = ndb.StringProperty(default='')

  active = ndb.BooleanProperty(default=True)
  admin = ndb.BooleanProperty(default=False)

  federated_id = ndb.StringProperty(default='')

  _PROPERTIES = Base._PROPERTIES.union(set([
      'name', 'username', 'avatar_url',
    ]))
