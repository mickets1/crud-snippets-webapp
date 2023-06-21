import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

// Create a schema.
const snippetsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: '`{PATH}` is required!!'
  },
  codeContent: {
    type: String,
    required: '`{PATH}` is required!'
  }
}, {
  timestamps: true,
  versionKey: false
})

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    minlength: [5, 'Username must be longer than 5 characters.'],
    required: [true, 'Username required'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    minlength: [10, 'Password must be longer than 10 characters.'],
    maxlength: [100, 'Password must be shorter than 100 characters.'],
    required: [true, 'Password required']
  },
  sessionID: {
    type: String
  },
  userSnippetsID: {
    type: [String]
  }
}, {
  timestamps: true,
  versionKey: false
})

/**
 * Compares input username and password against hashed password in database.
 *
 * @param {string} username username.
 * @param {string} password password.
 * @returns {object} User database entry.
 */
userSchema.statics.authenticate = async function (username, password) {
  const user = await this.findOne({ username })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error('Invalid login attempt.')
  }
  return user
}

/**
 * Encrypts plain password using bcryptjs.
 */
userSchema.methods.saveAndHash = async function () {
  try {
    this.password = await bcrypt.hash(this.password, 8)
    await this.save()
  } catch (error) {
    throw new Error('Username already exists.')
  }
}

// Create a model using the schema.
export const Snippets = mongoose.model('Snippets', snippetsSchema)
export const User = mongoose.model('User', userSchema)
