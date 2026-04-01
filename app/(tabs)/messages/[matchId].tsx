// The chat screen between the two matched users 

// import all the necessary modules and libraries
import {
    getUserById,
    sendMessage,
    subscribeToMessages
} from '@/services/firebase/firestoreService';
import { useUserStore } from '@/store/userStore';
import { Message, User } from '@/types/database';
import { router, useLocalSearchParams } from 'expo-router';
import {
    useEffect,
    useRef,
    useState
} from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function ChatScreen() {

    const { matchId, otherUserId } = useLocalSearchParams<{
        matchId:string;
        otherUserId?:string;
    }>();
    
    const { user } = useUserStore();

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [otherUser, setOtherUser] = useState<User | null>(null);

    const flatListRef = useRef<FlatList>(null);

    // Load the user profile for the header

    useEffect(() => {
        if (otherUserId) {
            getUserById(otherUserId).then(setOtherUser).catch(console.error);
        }
    }, [otherUserId]);

    // Subscribe to real time messages, which will automatically call the callback 
    // will keep a connection to Firestore and will automatically update the chat

    useEffect(() => {
        if (!matchId) return;

        const unsubscribe = subscribeToMessages(matchId, (updatedMessages) => {
            setMessages(updatedMessages);
            // set a delay so the list renders 
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        });

        //Stop the listener when leaving this screen
        return () => unsubscribe();
    }, [matchId]);

    // Send a message
    const handleSend = async () => {
        const trimmed = newMessage.trim();

        // Check not send empty or duplicates 
        if (!trimmed || !user?.uid || !matchId || sending) return;

        try {
            setSending(true);
            setNewMessage(''); // clear the input field

            await sendMessage(matchId, user.uid, trimmed);

        } catch (error) {
            console.error('Failed to send: ', error);
            setNewMessage(trimmed); //restore the text if there's an error
        } finally {
            setSending(false);
        }
    };

    // Render one message bubble
    const renderMessage = ({ item, index }: { item: Message, index: number }) => {

        // Check if the emssage is from the currently logged in user
        const isMe = item.senderId === user?.uid;

        //Show a timestamp if it's the first message or if it's been over 5 min
        const prev = index > 0 ? messages[index - 1] : null;
        const showTime = !prev || 
            (item.createdAt.getTime() - prev.createdAt.getTime()) > 5 * 60 * 1000;
        
        
        return (
            <View>
                {/* Timestamp between the message groups */}
                {showTime && (
                    <Text style={styles.timestamp}>
                        {item.createdAt.toLocaleTimeString([], {
                            hour: '2-digit', minute:'2-digit'
                        })}
                    </Text>
                )}

                {/* Align the bubble to either left or right depending on who sent 
                    the message, right for the user(Me) and left for the otherUser */}
                <View style={[
                    styles.bubbleContainer,
                    isMe ? styles.myBubbleContainer : styles.theirBubbleContainer
                ]}>
                    <View style= {[
                        styles.bubble,
                        isMe ? styles.myBubble : styles.theirBubble
                    ]}>
                        <Text style={[
                            styles.bubbleText,
                            isMe ? styles.myText : styles.theirText
                        ]}>
                            {item.text}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        // KeyboardAvoidingView is used so the screen is shifted up
        // when the keyboard opens

        <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height' }
        >

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => 
                    router.back()} style={styles.backButton}>
                        <Text style={styles.backIcon}> ← </Text>
                </TouchableOpacity>

                {otherUser ? (
                    <View style={styles.headerUserInfo}>
                        <Image 
                            source= {{ uri: otherUser.profilePicture }}
                            style={styles.headerAvatar}
                        />
                        <View>
                            <Text style={styles.headerName}> {otherUser.name} </Text>   
                            <Text style={styles.headerStatus}> Active </Text> 
                        </View>
                    </View>
                ) : ( 
                    <Text style={styles.headerName}> Chat</Text>
                )}
            </View>

            {/* Messages or empty */}
            {messages.length === 0 ? (
                <View style={styles.emptyChat}>
                    <Text style={styles.emptyChatIcon}> 🐾 </Text>
                    <Text style={styles.emptyChatText}>
                        It's a Match! Send a message to {'\n'} start the conversation!
                    </Text>
                </View>
            ) : ( 
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.messagesList}
                    onLayout={() =>
                        flatListRef.current?.scrollToEnd({ animated: false })
                    }
                />
            )}

        {/* Input bar */}
        <View style={styles.inputBar}>
            <TextInput
                style={styles.textInput}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Type a message..."
                placeholderTextColor="#9ca3af"
                multiline
                maxLength={500}
            />

            <TouchableOpacity
                style={[
                    styles.sendButton, 
                    //grey out the button if there's no text or it's sending
                    (!newMessage.trim() || sending) && styles.sendButtonDisabled
                ]}
                onPress={handleSend}
                disabled={!newMessage.trim() || sending}
                >

                    {sending
                        ? <ActivityIndicator size="small" color="white" />
                        : <Text style={styles.sendIcon}> ➤ </Text>
                    }
            </TouchableOpacity>
        </View>

        </KeyboardAvoidingView>
    );
}

// styling 
const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f9fafb' 
    },

    header: {
        flexDirection: 'row', 
        alignItems: 'center',
        paddingTop: 60, 
        paddingBottom: 12, 
        paddingHorizontal: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1, 
        borderBottomColor: '#e5e7eb',
    },

    backButton: { 
        marginRight: 12, 
        padding: 4 
    },

    backIcon: { 
        fontSize: 24, 
        color: '#10b981' 
    },

    headerUserInfo: { flexDirection: 'row', 
        alignItems: 'center' 
    },

    headerAvatar: { 
        width: 40, 
        height: 40, 
        borderRadius: 20, 
        marginRight: 10 
    },

    headerName: { 
        fontSize: 17, 
        fontWeight: '600', 
        color: '#111827' 
    },

    headerStatus: { 
        fontSize: 13, 
        color: '#10b981' 
    },

    messagesList: { 
        padding: 16, 
        paddingBottom: 8 
    },

    timestamp: {
        textAlign: 'center', 
        fontSize: 12,
        color: '#9ca3af', 
        marginVertical: 8,
    },

    bubbleContainer: { 
        marginBottom: 4, 
        flexDirection: 'row' 
    },

    myBubbleContainer: { 
        justifyContent: 'flex-end' 
    },

    theirBubbleContainer: { 
        justifyContent: 'flex-start' 
    },

    bubble: {
        maxWidth: '75%', 
        paddingHorizontal: 14,
        paddingVertical: 10, 
        borderRadius: 18,
    },

    myBubble: { 
        backgroundColor: '#10b981', 
        borderBottomRightRadius: 4 
    },

    theirBubble: {
        backgroundColor: 'white', 
        borderBottomLeftRadius: 4,
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, 
        shadowRadius: 2, 
        elevation: 1,
    },

    bubbleText: { 
        fontSize: 15, 
        lineHeight: 21 
    },

    myText: { 
        color: 'white' 
    },

    theirText: { 
        color: '#111827' 
    },

    emptyChat: {
        flex: 1, 
        alignItems: 'center',
        justifyContent: 'center', 
        padding: 32,
    },

    emptyChatIcon: { 
        fontSize: 48, 
        marginBottom: 16 
    },

    emptyChatText: {
        fontSize: 15, 
        color: '#6b7280',
        textAlign: 'center', 
        lineHeight: 22,
    },

    inputBar: {
        flexDirection: 'row', 
        alignItems: 'flex-end',
        padding: 12,
        paddingBottom: Platform.OS === 'ios' ? 28 : 12,
        backgroundColor: 'white',
        borderTopWidth: 1, 
        borderTopColor: '#e5e7eb',
        gap: 8,
    },

    textInput: {
        flex: 1, 
        backgroundColor: '#f3f4f6',
        borderRadius: 22, 
        paddingHorizontal: 16,
        paddingVertical: 10, 
        fontSize: 15,
        color: '#111827', 
        maxHeight: 100,
    },

    sendButton: {
        width: 42, 
        height: 42, 
        borderRadius: 21,
        backgroundColor: '#10b981',
        alignItems: 'center', 
        justifyContent: 'center',
    },

    sendButtonDisabled: { 
        backgroundColor: '#d1fae5' 
    },

    sendIcon: { 
        fontSize: 18, 
        color: 'white' 
    },
});
