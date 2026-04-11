// import { BrowserRouter, Routes, Route } from 'react-router-dom';

// // Page components (you will create these)
// import Login from './pages/Login';
// import Profile from './pages/Profile';
// import MapScreen from './pages/MapScreen';
// import GardenDetail from './pages/GardenDetail';

// function App() {
// 	return (
// 		<BrowserRouter>
// 			<Routes>
// 				<Route path='/' element={<MapScreen />} />
// 				<Route path='/login' element={<Login />} />
// 				<Route path='/profile' element={<Profile />} />
// 				<Route path='/garden/:id' element={<GardenDetail />} />
// 			</Routes>
// 		</BrowserRouter>
// 	);
// }

// export default App;

import { useEffect } from 'react';
import api from './api/client.js';

function App() {
	useEffect(() => {
		api
			.post('/api/token/', {
				username: 'testbee',
				password: 'masonbee',
			})
			.then((tokens) => {
				console.log('Tokens:', tokens);
				api.setTokens(tokens);
			})
			.catch((err) => console.error('Login error:', err));
	}, []);

	return <div>Testing API… check console</div>;
}

export default App;
