import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Page components (you will create these)
import Login from './pages/Login';
import Profile from './pages/Profile';
import MapScreen from './pages/MapScreen';
import GardenDetail from './pages/GardenDetail';

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path='/' element={<MapScreen />} />
				<Route path='/login' element={<Login />} />
				<Route path='/profile' element={<Profile />} />
				<Route path='/garden/:id' element={<GardenDetail />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
