export function databaseError(error) {
  if (error.code === 18 || error.codeName === 'AuthenticationFailed')
    return 'MongoDB authentication failed. Check the database user/password, URL-encoded credentials and authSource.';
  if (
    ['ENOTFOUND', 'ECONNREFUSED', 'ETIMEOUT', 'ESERVFAIL'].includes(error.code) ||
    error.name === 'MongooseServerSelectionError'
  )
    return 'MongoDB is unreachable. Check the cluster hostname, network/DNS, Atlas IP access list and whether the cluster is running.';
  if (error.name === 'MongoParseError' || error.name === 'TypeError')
    return 'Invalid MongoDB connection string. Copy the driver URI from Atlas, select creatoros_dev or creatoros_prod and URL-encode the username/password.';
  return 'MongoDB connection failed. Check MONGO_URI, database permissions and network access. Credentials are omitted from diagnostics.';
}