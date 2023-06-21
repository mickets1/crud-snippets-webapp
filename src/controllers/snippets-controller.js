import moment from 'moment'
import createError from 'http-errors'
import { Snippets, User } from '../models/snippets.js'

/**
 * Encapsulates a controller.
 */
export class SnippetsController {
  /**
   * Displays a list of snippets.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express' next error middleware function.
   */
  async index (req, res, next) {
    try {
      const viewData = {
        snippets: (await Snippets.find({}))
          .map(snippet => ({
            id: snippet._id,
            createdAt: moment(snippet.createdAt).fromNow(),
            codeContent: snippet.codeContent,
            title: snippet.title
          }))
          .sort((a, b) => a.value - b.value)
      }

      if (req.session.isAuth) {
        res.render('./snippets/index', { viewData, header: 'header-loggedin', username: req.session.username })
      } else {
        res.render('./snippets/index', { viewData, header: undefined })
      }
    } catch (error) {
      next(error)
    }
  }

  /**
   * Profile page listing user specific snippets.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express' next error middleware function.
   */
  async profile (req, res, next) {
    try {
      if (req.session.isAuth) {
        const userSnippets = await User.findOne({ sessionID: req.session.id })

        // Find only user specific snippets.
        const viewData = {
          snippets: (await Snippets.find({ _id: userSnippets.userSnippetsID }))
            .map(snippet => ({
              id: snippet._id,
              createdAt: moment(snippet.createdAt).fromNow(),
              codeContent: snippet.codeContent,
              title: snippet.title
            }))
            .sort((a, b) => a.value - b.value)
        }

        req.session.username = userSnippets.username

        // Header: Alternative header for logged in users.
        res.render('./accounts/profile', { viewData, header: 'header-loggedin', username: userSnippets.username })
      } else {
        next(createError(404, 'Not Found'))
      }
    } catch (error) {
      next(error)
    }
  }

  /**
   * Returns a HTML form for creating a new pure number.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express' next error middleware function.
   */
  async new (req, res, next) {
    try {
      const viewData = {
        title: undefined,
        codeContent: undefined
      }
      if (req.session.isAuth) {
        res.render('./snippets/new', { viewData, header: 'header-loggedin', username: req.session.username })
      } else {
        next(createError(404, 'Not Found'))
      }
    } catch (error) {
      next(error)
    }
  }

  /**
   * Creates a new snippet.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express' next error middleware function.
   */
  async create (req, res, next) {
    try {
      if (req.session.isAuth) {
      // Create a new snippet.
        const snippet = new Snippets({
          title: req.body.title,
          codeContent: req.body.value
        })

        await snippet.save()

        // Saves Snippet id to user specific array.
        await User.findOneAndUpdate({ sessionID: req.session.id }, { $push: { userSnippetsID: snippet._id }, username: req.session.username })

        // ...and redirect and show a message.
        req.session.flash = { type: 'success', text: 'Saved successfully.' }
        res.redirect('.')
      } else {
        next(createError(404, 'Not Found'))
      }
    } catch (error) {
      // If an error, or validation error, occurred, view the form and an error message.
      res.render('./snippets/new', {
        validationErrors: [error.message] || [error.errors.value.message],
        value: req.body.value
      })
    }
  }

  /**
   * Render edit page of user snippet.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  async edit (req, res) {
    try {
      if (req.session.isAuth) {
        const userData = await Snippets.findOne({ _id: req.params.id })

        const viewData = {
          id: userData._id,
          title: userData.title,
          codeContent: userData.codeContent
        }

        res.render('./snippets/edit', { viewData, header: 'header-loggedin', username: req.session.username })
      }
    } catch (error) {
      res.render('./snippets/edit', {
        validationErrors: [error.message] || [error.errors.value.message],
        value: req.body.value
      })
    }
  }

  /**
   * Render remove page of user snippet.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  async remove (req, res) {
    try {
      const userData = await Snippets.findOne({ _id: req.params.id })

      const viewData = {
        id: userData._id,
        title: userData.title,
        codeContent: userData.codeContent
      }

      res.render('./snippets/remove', { viewData, header: 'header-loggedin', username: req.session.username })
    } catch (error) {
      res.render('./snippets/remove', {
        validationErrors: [error.message] || [error.errors.value.message],
        value: req.body.value
      })
    }
  }

  /**
   * Updates a snippet entry in the database.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  async update (req, res) {
    try {
      const userData = await Snippets.updateOne({ _id: req.body.id }, {
        title: req.body.title,
        codeContent: req.body.code
      })

      if (userData.nModified === 1) {
        req.session.flash = { type: 'success', text: 'The task was updated successfully.' }
      } else {
        req.session.flash = {
          type: 'danger', text: 'Update failed. Try again.'
        }
      }
      res.redirect('..')
    } catch (error) {
      res.render('./snippets/edit', {
        validationErrors: [error.message] || [error.errors.value.message],
        value: req.body.value
      })
    }
  }

  /**
   * Deletes a snippet entry in the database.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  async delete (req, res) {
    try {
      await Snippets.deleteOne({ _id: req.body.id })

      // Deletes snippet from user array.
      const del = await User.findOne({ sessionID: req.session.id })
      del.userSnippetsID.pull(req.body.id)
      del.save()

      req.session.flash = { type: 'success', text: 'The task was deleted successfully.' }
      res.redirect('..')
    } catch (error) {
      res.render('./snippets/remove', {
        validationErrors: [error.message] || [error.errors.value.message],
        value: req.body.value
      })
    }
  }

  /**
   * Snippet full view.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  async view (req, res) {
    try {
      const userData = await Snippets.findOne({ _id: req.params.id })

      const viewData = {
        id: userData._id,
        title: userData.title,
        codeContent: userData.codeContent
      }

      if (req.session.isAuth) {
        res.render('./snippets/snippetfullview', { viewData, header: 'header-loggedin', username: req.session.username })
      } else {
        res.render('./snippets/snippetfullview', { viewData })
      }
    } catch (error) {
      res.render('./snippets/view', {
        validationErrors: [error.message] || [error.errors.value.message],
        value: req.body.value
      })
    }
  }
}
