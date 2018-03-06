import React, { Component } from 'react'

import SideBar from '../sidebar/SideBar'
import { COMMUNITY_CHAT, MESSAGE_SENT, MESSAGE_RECIEVED,
				TYPING, PRIVATE_MESSAGE, USER_CONNECTED,
				USER_DISCONNECTED, NEW_CHAT_USER } from '../../Events'
import ChatHeading from './ChatHeading'
import Messages from '../messages/Messages'
import MessageInput from '../messages/MessageInput'
import { values, difference, differenceBy } from 'lodash'

export default class ChatContainer extends Component {
	constructor (props) {
	  super(props)

	  this.state = {
		  chats: [],
		  users: [],
	  	activeChat: null
	  }
	}

	componentDidMount () {
		this.initSocket(this.props.socket)
	}

	componentWillUnmount () {
		const {socket} = this.props
		socket.off(PRIVATE_MESSAGE)
		socket.off(USER_CONNECTED)
		socket.off(USER_DISCONNECTED)
		socket.off(NEW_CHAT_USER)
	}

	initSocket (socket) {
		socket.emit(COMMUNITY_CHAT, this.resetChat)
		socket.on(PRIVATE_MESSAGE, this.addChat)
		socket.on('connect', () => {
			socket.emit(COMMUNITY_CHAT, this.resetChat)
		})
		socket.on(USER_CONNECTED, (users) => {
			this.setState({users: values(users)})
		})
		socket.on(USER_DISCONNECTED, (users) => {
			const removedUsers = differenceBy(this.state.users, values(users), 'id')
			this.removeUsersFromChat(removedUsers)
			this.setState({users: values(users)})
		})
		socket.on(NEW_CHAT_USER, this.addUserToChat)
	}

	sendOpenPrivateMessage = (reciever) => {
		const {props: {socket, user}, state: {activeChat}} = this
		socket.emit(PRIVATE_MESSAGE, {reciever, sender: user.name, activeChat})
	}

	addUserToChat = ({chatId, newUser}) => {
		const newChats = this.state.chats.map((chat) => {
			if (chat.id === chatId) {
				return Object.assign({}, chat, {users: [...chat.users, newUser]})
			}
			return chat
		})
		this.setState({chats: newChats})
	}

	removeUsersFromChat = (removedUsers) => {
		const newChats = this.state.chats.map((chat) => {
			let newUsers = difference(chat.users, removedUsers.map((u) => (u.name)))
			return Object.assign({}, chat, {users: newUsers})
		})
		this.setState({chats: newChats})
	}

	resetChat = (chat) => ( this.addChat(chat, true) )

	addChat = (chat, reset = false) => {
		const {props: {socket}, state: {chats}} = this
		const newChats = reset ? [chat] : [...chats, chat]

		this.setState((prevState) => {
			return {chats: newChats, activeChat: (reset ? chat : prevState.activeChat)}
		})

		const messageEvent = `${MESSAGE_RECIEVED}-${chat.id}`
		const typingEvent = `${TYPING}-${chat.id}`

		socket.on(typingEvent, this.updateTypingInChat(chat.id))
		socket.on(messageEvent, this.addMessageToChat(chat.id))
	}

	addMessageToChat = (chatId) => {
		return message => {
			let newChats = this.state.chats.map((chat) => {
				if (chat.id === chatId) {
					chat.messages.push(message)
				}
				return chat
			})

			this.setState({chats: newChats})
		}
	}

	updateTypingInChat = (chatId) => {
		return ({isTyping, user}) => {
			if (user !== this.props.user.name) {
				let newChats = this.state.chats.map((chat) => {
					if (chat.id === chatId) {
						if (isTyping && !chat.typingUsers.includes(user)) {
							chat.typingUsers.push(user)
						} else if (!isTyping && chat.typingUsers.includes(user)) {
							chat.typingUsers = chat.typingUsers.filter((u) => (u !== user))
						}
					}
					return chat
				})

				this.setState({chats: newChats})
			}
		}
	}

	sendMessage = (chatId, message) => {
		this.props.socket.emit(MESSAGE_SENT, {chatId, message})
	}

	sendTyping = (chatId, isTyping) => {
		this.props.socket.emit(TYPING, {chatId, isTyping})
	}

	setActiveChat = (activeChat) => ( this.setState({activeChat}) )

	render() {
		const {props: {user, logout}, state: {chats, activeChat, users}} = this

		return (
			<div className='container'>
				<SideBar
					logout={logout}
					chats={chats}
					user={user}
					users={users}
					activeChat={activeChat}
					setActiveChat={this.setActiveChat}
					onSendPrivateMessage={this.sendOpenPrivateMessage}
				/>
				<div className='chat-room-container'>
					{(activeChat !== null)
						? <div className='chat-room'>
								<ChatHeading name={activeChat.name} />
								<Messages
									messages={activeChat.messages}
									user={user}
									typingUsers={activeChat.typingUsers}
								/>
								<MessageInput
									sendMessage={(message) => {
										this.sendMessage(activeChat.id, message)
									}}
									sendTyping={(isTyping) => {
										this.sendTyping(activeChat.id, isTyping)
									}}
								/>
							</div>
						: <div className='chat-room choose'>
								<h3>Choose a chat!</h3>
							</div>}
				</div>
			</div>
		)
	}
}
