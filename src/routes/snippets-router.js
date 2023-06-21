import express from 'express'
import { SnippetsController } from '../controllers/snippets-controller.js'
import { AccountsController } from '../controllers/accounts-controller.js'

export const router = express.Router()

const snippetsController = new SnippetsController()
const accountsController = new AccountsController()

// Map HTTP verbs and route paths to controller actions.
router.get('/', snippetsController.index)

router.get('/login', accountsController.login)
router.post('/login', accountsController.loginPost)

router.get('/profile', snippetsController.profile)

router.get('/:id/edit', accountsController.authorizeEditAndDelete, snippetsController.edit)
router.post('/:id/update', accountsController.authorizeEditAndDelete, snippetsController.update)
router.get('/:id/remove', accountsController.authorizeEditAndDelete, snippetsController.remove)
router.post('/:id/delete', accountsController.authorizeEditAndDelete, snippetsController.delete)

router.get('/:id/snippetfullview', snippetsController.view)

router.get('/new', snippetsController.new)
router.post('/create', snippetsController.create)

router.get('/register', accountsController.register)
router.post('/createUser', accountsController.registerUser)

router.post('/logout', accountsController.logout)
