import React, { useState } from 'react';
import { FolderOpen } from 'lucide-react';

const gamesHubItems = [
	{
		id: 'community-garden',
		label: 'Community Garden.exe',
		icon: '🌱',
		type: 'executable',
		size: '2.4 MB',
		modified: '7/2/2025',
		description: 'A real-time community virtual garden game',
		onClick: () => window.dispatchEvent(new CustomEvent('open-garden-app')),
	},
	{
		id: 'game-reviews',
		label: 'Games Library.exe', 
		icon: '🎮',
		type: 'executable',
		size: '1.8 MB',
		modified: '7/1/2025',
		description: 'Browse games library and reviews',
		onClick: () => window.dispatchEvent(new CustomEvent('open-game-reviews')),
	}
];

export const GamesHubWindow: React.FC = () => {
	const [clickingItem, setClickingItem] = useState<string | null>(null);

	const handleItemClick = (item: typeof gamesHubItems[0]) => {
		// Prevent double-clicking from opening multiple windows
		if (clickingItem === item.id) return;
		
		setClickingItem(item.id);
		item.onClick();
		
		// Reset the clicking state after a brief delay
		setTimeout(() => setClickingItem(null), 500);
	};

	return (
		<div className="h-full bg-white flex flex-col overflow-hidden">
			{/* File Explorer Header */}
			<div className="bg-gray-50 border-b border-gray-200 p-2 flex items-center gap-2">
				<FolderOpen size={16} className="text-blue-600" />
				<span className="text-sm font-medium">Games</span>
				<span className="text-xs text-gray-500 ml-auto">
					{gamesHubItems.length} items
				</span>
			</div>
			
			{/* Toolbar */}
			<div className="bg-gray-100 border-b border-gray-200 p-1 flex items-center gap-1 text-xs">
				<span className="text-gray-600">View:</span>
				<button className="px-2 py-1 bg-white border border-gray-300 rounded text-xs hover:bg-gray-50">
					Large icons
				</button>
			</div>

			{/* File List */}
			<div className="flex-1 p-4 overflow-auto pb-2">
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{gamesHubItems.map((item) => (
						<button
							key={item.id}
							className={`flex flex-col items-center p-3 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-transparent group transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
								clickingItem === item.id ? 'opacity-50 pointer-events-none' : ''
							}`}
							onClick={() => handleItemClick(item)}
							title={item.description}
							disabled={clickingItem === item.id}
						>
							{/* File Icon */}
							<div className="mb-2 text-4xl filter drop-shadow-sm group-hover:scale-110 transition-transform">
								{item.icon}
							</div>
							
							{/* File Name */}
							<span className="text-sm font-medium text-center leading-tight mb-1">
								{item.label}
							</span>
							
							{/* File Info */}
							<div className="text-xs text-gray-500 text-center">
								<div>{item.size}</div>
								<div>{item.modified}</div>
							</div>
						</button>
					))}
				</div>
			</div>
			
			{/* Status Bar */}
			<div className="bg-gray-50 border-t border-gray-200 p-2 text-xs text-gray-600 flex items-center justify-between flex-shrink-0">
				<span>{gamesHubItems.length} items</span>
				<span>Ready</span>
			</div>
		</div>
	);
};
