// Mock users for development, this is so there's something visible in the development of the app
// An array of user objects with relevant details
export const mockUsers = [
  {
    id: '1',
    name: 'Sarah Chen',
    bio: 'Golden retriever enthusiast looking for walking buddies',
    location: 'Camden, London',
    distance: '0.5 miles',
    imageUrl: 'https://i.pravatar.cc/300?img=1',
    pets: [
      {
        id: 'p1',
        name: 'Max',
        type: 'Dog',
        breed: 'Golden Retriever',
        age: 3
      }
    ],
    interests: ['Dog walks', 'Park meetups', 'Training tips']
  },
  {
    id: '2',
    name: 'James Wilson',
    bio: 'Cat dad and coffee lover',
    location: 'Shoreditch, London',
    distance: '1.2 miles',
    imageUrl: 'https://i.pravatar.cc/300?img=12',
    pets: [
      {
        id: 'p2',
        name: 'Luna',
        type: 'Cat',
        breed: 'British Shorthair',
        age: 2
      }
    ],
    interests: ['Cat care', 'Pet photography', 'Indoor activities']
  },
  {
    id: '3',
    name: 'Emma Thompson',
    bio: 'Rescue dog advocate and trainer',
    location: 'Hampstead, London',
    distance: '2.1 miles',
    imageUrl: 'https://i.pravatar.cc/300?img=5',
    pets: [
      {
        id: 'p3',
        name: 'Buddy',
        type: 'Dog',
        breed: 'Mixed Rescue',
        age: 5
      }
    ],
    interests: ['Dog training', 'Rescue advocacy', 'Hiking']
  }
];

// Mock events
export const mockEvents = [
  {
    id: 'e1',
    title: 'Weekend Dog Park Meetup',
    description: 'Casual meetup for dogs and their owners. All breeds welcome!',
    date: '2026-01-18',
    time: '10:00 AM',
    location: "Regent's Park",
    address: 'Chester Rd, London NW1 4NR',
    attendees: 12,
    maxAttendees: 20,
    imageUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400',
    organizer: 'Sarah Chen',
    petTypes: ['Dog']
  },
  {
    id: 'e2',
    title: 'Cat Cafe Social',
    description: 'Meet fellow cat lovers over coffee and treats',
    date: '2026-01-20',
    time: '2:00 PM',
    location: 'Paws & Coffee',
    address: '123 High Street, London',
    attendees: 8,
    maxAttendees: 15,
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
    organizer: 'James Wilson',
    petTypes: ['Cat']
  },
  {
    id: 'e3',
    title: 'Basic Dog Training Workshop',
    description: 'Learn essential commands and techniques from a certified trainer',
    date: '2026-01-22',
    time: '11:00 AM',
    location: 'Hampstead Heath',
    address: 'East Heath Rd, London NW3',
    attendees: 6,
    maxAttendees: 10,
    imageUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400',
    organizer: 'Emma Thompson',
    petTypes: ['Dog']
  }
];