from google.appengine.ext import ndb
from google.appengine.api import users

import functools

import flask
import flaskext.login
import flaskext.oauth

import util
import model
import config

from main import app


################################################################################
# Flaskext Login
################################################################################
login_manager = flaskext.login.LoginManager()


class AnonymousUser(flaskext.login.AnonymousUser):
  id = 0
  admin = False
  name = 'Anonymous'

  def key(self):
    return None

login_manager.anonymous_user = AnonymousUser


class FlaskUser(AnonymousUser):
  def __init__(self, user_db):
    self.user_db = user_db
    self.id = user_db.key.id()
    self.name = user_db.name
    self.admin = user_db.admin

  def key(self):
    return self.user_db.key.urlsafe()

  def get_id(self):
    return self.user_db.key.urlsafe()

  def is_authenticated(self):
    return True

  def is_active(self):
    return self.user_db.active

  def is_anonymous(self):
    return False


@login_manager.user_loader
def load_user(key):
  user_db = ndb.Key(urlsafe=key).get()
  if user_db:
    return FlaskUser(user_db)
  return None


login_manager.setup_app(app)


def current_user_id():
  return flaskext.login.current_user.id


def current_user_key():
  return flaskext.login.current_user.user_db.key


def current_user_db():
  return current_user_key().get()


def is_logged_in():
  return current_user_id() != 0


def login_required(f):
  @functools.wraps(f)
  def decorated_function(*args, **kws):
    if is_logged_in():
      return f(*args, **kws)
    if flask.request.path.startswith('/_s/'):
      return flask.abort(401)
    return flask.redirect(flask.url_for('signin', next=flask.request.url))
  return decorated_function


def admin_required(f):
  @functools.wraps(f)
  def decorated_function(*args, **kws):
    if is_logged_in() and current_user_db().admin:
      return f(*args, **kws)
    if not is_logged_in() and flask.request.path.startswith('/_s/'):
      return flask.abort(401)
    if not is_logged_in():
      return flask.redirect(flask.url_for('signin', next=flask.request.url))
    return flask.abort(403)
  return decorated_function


################################################################################
# Sign in stuff
################################################################################
@app.route('/login/')
@app.route('/signin/')
def signin():
  next_url = util.get_next_url()
  if flask.url_for('signin') in next_url:
    next_url = flask.url_for('welcome')

  google_signin_url = flask.url_for('signin_google', next=next_url)
  
  return flask.render_template(
      'signin.html',
      title='Please sign in',
      html_class='signin',
      google_signin_url=google_signin_url,
      next_url=next_url,
    )


@app.route('/signout/')
def signout():
  flaskext.login.logout_user()
  flask.flash(u'You have been signed out.')
  return flask.redirect(flask.url_for('welcome'))


################################################################################
# Google
################################################################################
@app.route('/signin/google/')
def signin_google():
  google_url = users.create_login_url(
      flask.url_for('google_authorized', next=util.get_next_url())
    )
  return flask.redirect(google_url)


@app.route('/_s/callback/google/authorized/')
def google_authorized():
  google_user = users.get_current_user()
  if google_user is None:
    flask.flash(u'You denied the request to sign in.')
    return flask.redirect(util.get_next_url())

  user_db = retrieve_user_from_google(google_user)
  return signin_user_db(user_db)


def retrieve_user_from_google(google_user):
  user_db = model.User.retrieve_one_by('federated_id', google_user.user_id())
  if user_db:
    if not user_db.admin and users.is_current_user_admin():
      user_db.admin = True
      user_db.put()
    return user_db
  user_db = model.User(
      federated_id=google_user.user_id(),
      name=strip_username_from_email(google_user.nickname()),
      username=generate_unique_username(google_user.nickname()),
      email=google_user.email().lower(),
      admin=users.is_current_user_admin(),
    )
  user_db.put()
  return user_db


################################################################################
# Helpers
################################################################################
def signin_user_db(user_db):
  if not user_db:
    return flask.redirect(flask.url_for('signin'))

  flask_user_db = FlaskUser(user_db)
  if flaskext.login.login_user(flask_user_db):
    flask.flash('Hello %s, welcome to %s!!!' % (
        user_db.name, config.CONFIG_DB.brand_name,
      ), category='success')
    return flask.redirect(util.get_next_url())
  else:
    flask.flash('Sorry, but you could not sign in.', category='danger')
    return flask.redirect(flask.url_for('signin'))


def strip_username_from_email(email):
  #TODO: use re
  if email.find('@') > 0:
    email = email[0:email.find('@')]
  return email.lower()


def generate_unique_username(username):
  username = strip_username_from_email(username)

  new_username = username
  n = 1
  while model.User.retrieve_one_by('username', new_username) is not None:
    new_username = '%s%d' % (username, n)
    n += 1
  return new_username