const t = require('tap')
const mutateFS = require('mutate-fs')
const inferOwner = require('../')
const path = require('path')

const owner = { uid: 420, gid: 69 }
t.teardown(mutateFS.statMutate((er, st) => ([er, owner])))

t.test('infer ownership', t => {
  t.same(inferOwner.sync(path.join(__dirname, '/../a/b/sync')), owner)
  return inferOwner(path.join(__dirname, '/x/y/async')).then(res => t.same(res, owner))
})

t.test('pull from caches by running again', t => {
  // this doesn't have a different result, but coverage shows it worked
  // and that the caches are shared between sync and async
  t.same(inferOwner.sync(path.join(__dirname, '/x/y')), owner)
  return inferOwner(path.join(__dirname, '/../a/b')).then(res => t.same(res, owner))
})

t.test('inflight detection', t => Promise.all([
  inferOwner(path.join(__dirname, '/in/flight')),
  inferOwner(path.join(__dirname, '/x/../in/flight')),
]).then(results => t.same(results[0], results[1])))

t.test('all the way to the root', t => {
  t.same(inferOwner.sync('/does-not-exist/'), owner)
  inferOwner.clearCache()
  return inferOwner('/dont-exist-plz/').then(res => t.same(res, owner))
})
