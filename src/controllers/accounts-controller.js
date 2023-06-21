import { User } from '../models/snippets.js'
import createError from 'http-errors'

/**
 * Encapsulates a controller.
 */
export class AccountsController {
  /**
   * Middleware for Authorizing a user for editing and deleting operations.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express' next middleware function.
   */
  async authorizeEditAndDelete (req, res, next) {
    try {
      if (req.session.isAuth) {
        const userData = await User.findOne({ sessionID: req.session.id })
        // If user owns the resource.
        const userIsAuthorized = userData.userSnippetsID.includes(req.params.id)

        if (userIsAuthorized) {
          next()
        } else {
          next(createError(403, 'Forbidden'))
        }
      } else {
        next(createError(404, 'Not Found'))
      }
    } catch (error) {
      res.render('./accounts/login', {
        validationErrors: [error.message] || [error.errors.value.message],
        value: req.body.value
      })
    }
  }

  /**
   * Render login page.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  async login (req, res) {
    if (req.session.isAuth) {
      res.redirect('./profile')
    } else {
      res.render('./accounts/login')
    }
  }

  /**
   * Login functionality for the application.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  async loginPost (req, res) {
    try {
      const user = await User.authenticate(req.body.username, req.body.password)
      req.session.regenerate(async () => {
        if (user) {
          await user.updateOne({ sessionID: req.session.id })
          req.session.isAuth = true
          res.redirect('./profile')
        }
      })
    } catch (error) {
      res.render('./accounts/login', {
        validationErrors: [error.message] || [error.errors.value.message],
        value: req.body.value
      })
    }
  }

  /**
   * Registration form.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  async register (req, res) {
    if (!req.session.isAuth) {
      res.render('./accounts/register')
    }
  }

  /**
   * Register a user and save in the database.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  async registerUser (req, res) {
    try {
      const { username, password, confirmPassword } = req.body

      if (password !== confirmPassword) {
        req.session.flash = { type: 'danger', text: 'Passwords do not match.' }
        res.redirect('./register')
      } else {
        const user = new User({
          username: username,
          password: password,
          sessionID: 'session'
        })
        await user.saveAndHash()
        req.session.flash = { type: 'success', text: 'Registration successful, please login.' }
        res.redirect('./login')
      }
    } catch (error) {
      res.render('accounts/register', {
        validationErrors: [error.message] || [error.errors.value.message],
        value: req.body.value
      })
    }
  }

  /**
   * Destroys session and logs out user.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  async logout (req, res) {
    req.session.destroy()
    res.redirect('./')
  }
}
