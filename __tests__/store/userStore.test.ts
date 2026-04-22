import { useUserStore } from '@/store/userStore';
import { User as FirebaseUser } from 'firebase/auth';
import { User as FirestoreUser } from '@/types/database';

const mockFirebaseUser = { uid: 'abc123', email: 'test@test.com' } as FirebaseUser;
const mockProfile = { uid: 'abc123', name: 'Test User', email: 'test@test.com' } as FirestoreUser;

beforeEach(() => {
    useUserStore.setState({ user: null, profile: null, isLoading: false, error: null });
});

describe('useUserStore', () => {
    it('starts with empty state', () => {
        const { user, profile, isLoading, error } = useUserStore.getState();

        expect(user).toBeNull();
        expect(profile).toBeNull();
        expect(isLoading).toBe(false);
        expect(error).toBeNull();
    });

    it('setUser stores the Firebase user and clears any existing error', () => {
        useUserStore.getState().setError('previous error');
        useUserStore.getState().setUser(mockFirebaseUser);

        const { user, error } = useUserStore.getState();
        expect(user).toBe(mockFirebaseUser);
        expect(error).toBeNull();
    });

    it('setUser accepts null to clear the auth user', () => {
        useUserStore.setState({ user: mockFirebaseUser });
        useUserStore.getState().setUser(null);

        expect(useUserStore.getState().user).toBeNull();
    });

    it('setProfile stores the Firestore user document', () => {
        useUserStore.getState().setProfile(mockProfile);

        expect(useUserStore.getState().profile).toBe(mockProfile);
    });

    it('setProfile accepts null to clear the profile', () => {
        useUserStore.setState({ profile: mockProfile });
        useUserStore.getState().setProfile(null);

        expect(useUserStore.getState().profile).toBeNull();
    });

    it('setLoading updates the loading flag', () => {
        useUserStore.getState().setLoading(true);
        expect(useUserStore.getState().isLoading).toBe(true);

        useUserStore.getState().setLoading(false);
        expect(useUserStore.getState().isLoading).toBe(false);
    });

    it('setError stores an error message', () => {
        useUserStore.getState().setError('something went wrong');

        expect(useUserStore.getState().error).toBe('something went wrong');
    });

    it('logout clears user, profile, and error', () => {
        useUserStore.setState({ user: mockFirebaseUser, profile: mockProfile, error: 'err' });

        useUserStore.getState().logout();

        const { user, profile, error } = useUserStore.getState();
        expect(user).toBeNull();
        expect(profile).toBeNull();
        expect(error).toBeNull();
    });

    it('logout does not affect isLoading', () => {
        useUserStore.setState({ isLoading: true });
        useUserStore.getState().logout();

        expect(useUserStore.getState().isLoading).toBe(true);
    });
});
