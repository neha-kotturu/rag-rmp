'use client'
// import Image from "next/image";
// import styles from "./page.module.css";
import { Box, Button, Stack, TextField, useMediaQuery } from '@mui/material'
import { useState } from "react";
import SendIcon from '@mui/icons-material/Send'

export default function Home() {
	const isSmallScreen = useMediaQuery('(max-width:800px)')
	
	// set up state (managing messages and user input)
	const [messages, setMessages] = useState([
    {
		role: "assistant",
		content: "Hi! I'm the Rate My Professor support assistant. How can I help you today?"
    }
	])
	const [message, setMessage] = useState('')

	// sendMessage function
	const sendMessage = async () => {
		setMessages((prevMessages) => [
			...prevMessages,
			{ role: "user", content: message },
			{ role: "assistant", content: '' }
		])

		setMessage('')

		const response = await fetch('/api/chat', {
			method: 'POST',
			headers: {
			'Content-Type': 'application/json'
			},
			body: JSON.stringify({
			messages: [
				...messages,
				{ role: 'user', content: message }
			]
			}),
		})

		const reader = response.body.getReader()
		const decoder = new TextDecoder()
		let result = ''

		const readStream = async () => {
			const { done, value } = await reader.read()
			if (done) {
			return result
			}
			result += decoder.decode(value, { stream: true })

			setMessages((prevMessages) => {
			const lastMessage = prevMessages[prevMessages.length - 1]
			return [
				...prevMessages.slice(0, -1),
				{ ...lastMessage, content: lastMessage.content + result },
			]
			})

			return readStream()
		}

		await readStream()
	}

	// export the chat into a text file
	const exportChat = () => {
		// format the messages to be styled better
		const formattedMessages = messages.map((message) => {
			return `${message.role === 'assistant' ? 'Bot:' : 'You:'} ${message.content}`
		}).join('\n\n')

		const blob = new Blob([formattedMessages], { type: 'text/plain' })
		const link = document.createElement('a')
		link.href = URL.createObjectURL(blob)
		link.download = 'rmp-chat-history.txt'
		link.click()
	}

	const clearMessages = () => {
		setMessages([])
	}

	// styling
	const backgroundStyling = {
		width: '100vw',
		height: '100vh',
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		background: 'linear-gradient(135deg, #cbf2db, #dff5e8, #cbf2db)',
		padding: '10px'
	}

	const chatBox = {
		width: isSmallScreen ? '90rem' : '40rem',
		height: '90vh',
		border: '1px solid #ddd',
		borderRadius: '12px',
		background: '#ffffff',
		display: 'flex',
		flexDirection: 'column',
		padding: '20px',
		boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
		overflow: 'hidden',
		fontFamily: 'Roboto, sans-serif',
	}

	const heading = {
		marginBottom: '20px',
		textAlign: 'center',
		fontSize: '24px',
		fontWeight: 'bold',
		color: '#5fae81',
	}

	const chatMsgs = {
		flexGrow: 1,
		overflowY: 'auto',
		display: 'flex',
		flexDirection: 'column',
		gap: '12px',
		paddingRight: '10px',
	}

	const chatMsg = (role) => ({
		maxWidth: '80%',
		padding: '12px 16px',
		borderRadius: '20px',
		fontSize: '15px',
		lineHeight: '1.5',
		backgroundColor: role === 'assistant' ? '#f5f2f2' : '#5fae81',
		color: role === 'assistant' ? '#363535' : '#fff',
		alignSelf: role === 'assistant' ? 'flex-start' : 'flex-end',
		boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
	})

	const inputMsg = {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		marginTop: '10px',
	}

	const inputStyle = {
		flexGrow: 1,
		borderRadius: '24px',
		backgroundColor: '#f1f3f4',
		//removing input field border
		'& .MuiOutlinedInput-root': {
			borderRadius: '24px',
			'& fieldset': {
				border: 'none',
			},
			'&:hover fieldset': {
				border: 'none',
			},
			'&.Mui-focused fieldset': {
				border: 'none',
			},
		},
	}

	const buttons = {
		backgroundColor: '#5fae81',
		color: '#ffffff',
		border: 'none',
		padding: '10px 20px',
		borderRadius: '24px',
		cursor: 'pointer',
		fontSize: '14px',
		fontWeight: 'bold',
		'&:hover': {
			backgroundColor: '#2b5e41',
		},
	}


	// UI
	return (
	<>
		<Box sx={backgroundStyling}>
			<Box sx={chatBox}>
				<div style={heading}>Chat with RMP Assistant!</div>
				<Stack sx={chatMsgs}>
					{messages.map((message, index) => (
						<Box
							key={index}
							sx={chatMsg(message.role)}
						>
							{message.content}
							{message.questions && message.role === 'assistant'}
						</Box>
					))}
				</Stack>

				<Stack direction="row" sx={inputMsg}>
					<TextField
						label="Message"
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						variant="outlined"
						size="small"
						sx={inputStyle}
					/>
					<Button
						sx={buttons}
						variant="contained"
						onClick={() => sendMessage()}
					>
						<SendIcon />
					</Button>
				</Stack>

				<Button
					sx={{
						...buttons,
						marginTop: '15px',
					}}
					onClick={clearMessages}
				>
					Clear chat
				</Button>

				<Button 
					sx={{
						color: '#5fae81',
						border: 'none',
						padding: '10px 20px',
						borderRadius: '24px',
						cursor: 'pointer',
						fontSize: '14px',
						fontWeight: 'bold',
						'&:hover': {
							backgroundColor: '#f0f0f2',
						},
						marginTop: '10px',
					}}
					onClick={exportChat}
				>
					Export Chat
				</Button>
			</Box>
		</Box>
	</>
	)
}