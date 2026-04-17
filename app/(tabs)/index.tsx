// app/(tabs)/index.tsx
// This is the home screen. Here the user will see partnership banners, sponsored ads, and any other content that might be relevant to them.
// For now, it simulates partnerships and ads, for demonstration purposes only, showcasing how it would look like in the future.

import { getUserById } from '@/services/firebase/userService';
import { useUserStore } from '@/store/userStore';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';



// Tokens for each brand's colour 

const YELLOW = '#f2b949';
const BG = '#efefef'; // background
const NAVY_PAT = '#1e2d5a'; // Pet as Therapy brand navy
const ORANGE = '#e85d1a'; // Dogs Can Eat it brand orange
const BLUE_BAT = '#1b62ab'; // Battersea Cats and Dogs blue

// Static ad and partner data so it loads instantly, no need for additional read on Firestore
const TRENDING_EVENTS = [
  {
    id: '1',
    title: 'Puppy Playdate Meetup in Battersea Park',
    date: '10 May 2026',
    location: 'Battersea Park', 
    count: 32,
  },
  {
    id: '2',
    title: 'Seven Sisters Spring Dog Hike',
    date: '24 April 2026',
    location: 'Seven Sisters', 
    count: 21,
  },
];

const TIPS = [
  {
    icon: "map-pin" as const,
    title: "Heading somewhere new?",
    body: "Update your search radius in your profile before you explore to find dogs near your new spot.",
  },
  {
    icon: "camera" as const,
    title: "Keep your profile fresh and updated",
    body: "Update your pet's photos and personality tags regularly for better matches"
  },
  {
    icon: "calendar" as const,
    title: "Try the Events tab",
    body: "Group meetups are a low-pressure way for dogs and owners to socialise.",
  },
];

export default function HomeScreen() {
  const { user } = useUserStore();
  const [firstName, setFirstName] = useState<string>(''); 

  // Choose a random tip every time 
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  // Load the first name from the Firestore to personalise the greeting for each user
  useFocusEffect(
    React.useCallback(() => {
      const load = async () => {
        if (!user?.uid) return;
        try {
          const profile = await getUserById(user.uid);
          if (profile?.name) {
            setFirstName(profile.name.split(' ')[0]);
          }
        } catch (err) {
          // Greeting will work even if name isnt fetched
          console.warn('HomeScreen: could not load user profile', err);
        }
      };
      load();
    }, [user?.uid])
  );

  // Greeting
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const greeting = firstName
  ? `${getGreeting()}, ${firstName}!`
  : `${getGreeting()}!`;

  // then render
  return (
    
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={YELLOW} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* hero banner */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>{greeting}</Text>
            <Text style={styles.heroSub}>
              Discover what's new in your pet community
            </Text>
          </View>
          {/* Notification bell, a placeholder for now */}
          <TouchableOpacity 
            style={styles.bellBtn}
            accessibilityLabel="Notifications"
          >
            <Feather name="bell" size={17} color='#111'/>
          </TouchableOpacity>
        </View>
      </View>

        {/* First partner, Battersea cats & dogs */}
        <Text style={styles.sectionLabel}> Our charity partner </Text>
        
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => 
            Linking.openURL('https://www.battersea.org.uk/rehome/dogs')
          }
          accessibilityLabel="Battersea Dogs and Cats Home, tap to browse adoptable dogs"
        >
          {/* Logo banner for Battersea cats and dogs */}
          <View style={styles.logoBanner}>
            <Image
              source={require('@/assets/images/batterseacropped.jpg')}
              style={styles.logoImage}
              resizeMode="contain"
              accessibilityLabel="Battersea Dogs and Cats Home logo"
            />

          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.cardDesc}>
              Hundreds of dogs and cats near you are looking for their forever home.
            </Text>
            <TouchableOpacity
              style={[styles.ctaBtn, { backgroundColor: YELLOW }]}
              onPress={() => 
                Linking.openURL('https://www.battersea.org.uk/rehome/dogs')}
            >
              <Text style={[styles.ctaText, { color: '#111' }]}>
                Meet the dogs →
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Trending events */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabelPlain}>Trending events</Text>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>View all →</Text>
          </TouchableOpacity>
        </View>
      
      <View style={styles.eventsContainer}>  
        {TRENDING_EVENTS.map((event, index) => (
          <React.Fragment key={event.id}>
        <View style={styles.eventCard}>
          <View style={styles.eventLeft}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <View style={styles.eventMeta}>
              <Feather name="calendar" size={10} color="#ABABAB" />
              <Text style={styles.eventMetaText}>{event.date}</Text>
              <Feather name="map-pin" size={10} color="#ABABAB" />
              <Text style={styles.eventMetaText}>{event.location}</Text>
            </View>
          </View>
          <Text style={styles.eventCount}>↑ {event.count}</Text>
        </View>
        {/* Divider between events */}
        {index < TRENDING_EVENTS.length - 1 && (
          <View style={styles.sponsoredDivider} />
        )}
        </React.Fragment>
        ))}
      </View>
        {/* Ads / sponsored */}
        <Text style={styles.sectionLabel}>Sponsored</Text>

        <View style={styles.sponsoredContainer}>

        {/* Pet as Therapy */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => Linking.openURL('https://petastherapy.org')}
          accessibilityLabel="Pet As Therapy, tap to learn more"
        >
          <View style={[styles.logoBanner, { backgroundColor: '#ffffff' }]}>
            <Image 
              source={require('@/assets/images/pettherapy.gif')}
              style={styles.logoImage}
              resizeMode="contain"
              accessibilityLabel="Pet As Therapy logo"
            />
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.cardDesc}>
              Bringing people and animals together to improve wellbeing across the UK.
            </Text>
            <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: NAVY_PAT }]}
            onPress={() => Linking.openURL('https://petastherapy.org')}
            >
            <Text style={[styles.ctaText, { color: '#fff' }]}>
              Learn more
            </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.sponsoredDivider} />
          {/* Dogs Can Eat It */}
          <TouchableOpacity 
            activeOpacity={0.85}
            accessibilityLabel="Dogs Can Eat It app sponsored"
          >
            {/* Orange branded banner with logo and name */}
            <View style={[styles.logoBanner, { backgroundColor: ORANGE }]}>
              <View style={{ flexDirection:'row', alignItems:'center', gap: 16}}>
              <Image
                source={require('@/assets/images/dogscaneatit.jpg')}
                style={styles.appAdLogo}
                resizeMode="cover"
                accessibilityLabel="Dogs Can Eat It app icon"
              />
                <View style={{ flexDirection: 'column', gap: 4 }}>
                  <Text style={styles.appAdName}>Dogs Can Eat It</Text>
                  <Text style={styles.appAdSub}>
                    Instantly check what's {'\n'}safe for your dog to eat
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.cardFooter}>
                <Text style={styles.cardDesc}>
                  The essential food safety app for every dog owner.
                </Text>
              <TouchableOpacity
                style={[styles.ctaBtn, { backgroundColor: ORANGE }]}
                onPress={() => Linking.openURL('https://www.dogscaneatit.com')}
              >
                <Text style={[styles.ctaText, { color: '#fff' }]}>
                Learn more
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>

          {/* Tip of the day banner */}
          <Text style={styles.sectionLabel}>Tip of the day</Text>
          <View style={styles.tipCard}>
            <View style={styles.tipThumb}>
              <Feather name={tip.icon} size={22} color="#111" />
            </View>
            <View style={styles.tipInfo}>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <Text style={styles.tipBody}>{tip.body}</Text>
            </View>
          </View>

        {/* Invite / referral card */}
        <View style={styles.inviteCard}>
            <Image 
              source={require('@/assets/images/pawsmateLanding.png')}
              style={styles.inviteLogo}
              resizeMode="contain"
              accessibilityLabel="PawsMate logo"
            />
          <Text style={styles.inviteTitle}>Love PawsMate?</Text>
          <Text style={styles.inviteSub}>
            Invite your friends and earn rewards when they make their first connection!
          </Text>
          <TouchableOpacity style={styles.inviteBtn}>
            <Text style={styles.inviteBtnText}>Invite Friends</Text>
          </TouchableOpacity>
        </View>

         <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles 

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // Hero
  hero: {
    backgroundColor: YELLOW,
    paddingHorizontal: 20,
    paddingTop: 32,
    borderRadius:16,
    marginHorizontal:12,
    paddingBottom: 28,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
    lineHeight: 26,
  },
  heroSub: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.45)',
    marginTop: 3,
    fontWeight: '400',
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // Section Labels
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#111',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  // For sections with 'view all'
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  }, 
  sectionLabelPlain: {
  fontSize: 11,
  fontWeight: '700',
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  color: '#111',
  paddingTop: 0,
  paddingBottom: 0,
  },
  sectionLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111',
  },
  
  //Cards
  card: {
    marginHorizontal: 14,
    marginBottom: 8,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },

  // logo banner (for battersea + pet as therapy)
  logoBanner: {
    width: '100%',
    height: 110,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 16,
    position: 'relative',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  // Card footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F2F0EC',
  },
  cardDesc: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    height: 32,
  },
  ctaBtn: {
    flexShrink: 0,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop:2,
  },
  ctaText: {
    fontSize: 10,
    fontWeight: '700',
  },
  
  // Event container and event card
  eventsContainer: {
  marginHorizontal: 14,
  marginBottom: 8,
  borderRadius: 14,
  backgroundColor: '#fff',
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowOffset: { width: 0, height: 1 },
  shadowRadius: 3,
  elevation: 1,
  overflow: 'hidden',
  },
  eventCard: {
  padding: 12,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  },
  eventLeft: {
    flex: 1,
    paddingRight: 10,
  },
  eventTitle: {
    fontSize: 13,
    color: '#111',
    marginBottom: 5,
    lineHeight: 16,
    fontWeight: '600',
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventMetaText: {
    fontSize: 11,
    color: '#ABABAB',
    marginRight: 4,
  },
  eventCount: {
    fontSize: 13,
    fontWeight: '800',
    color: YELLOW,
    flexShrink: 0,
  },

  // sponsored container and divider
  sponsoredContainer: {
  marginHorizontal: 14,
  marginBottom: 8,
  borderRadius: 14,
  overflow: 'hidden',
  backgroundColor: '#fff',
  shadowColor: '#000',
  shadowOpacity: 0.07,
  shadowOffset: { width: 0, height: 1 },
  shadowRadius: 4,
  elevation: 2,
},

sponsoredDivider: {
  height: 1,
  backgroundColor: '#e5e7eb',
  marginHorizontal: 0,  // full-width within the container
},

 // Ad banners (dogs can eat it)
  appAdLogo: {
    width: 64,
    height: 64,
    borderRadius: 14,
  },
  appAdRight: {
    flexDirection: 'column',
    gap: 4,
  },
  appAdName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.4,
  },
  appAdSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 15,
  },
  adCopyWrap: {
    flex: 1,
    gap: 2,
  },
  adHeadline: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111',
    lineHeight: 17,
  },
  adSub: {
    fontSize: 10,
    color: '#999',
    lineHeight: 14,
  },

  // Tip card
  tipCard: {
    marginHorizontal: 14,
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: '#fff',
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  tipThumb: {
    width: 54,
    height: 54,
    borderRadius: 10,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: YELLOW,
  },
  tipInfo: {
    flex: 1,
  },
  tipTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tipTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },
  tipTagText: {
    fontSize: 8,
    fontWeight: '700',
  },
  tipReadTime: {
    fontSize: 8,
    color: '#ABABAB',
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111',
    lineHeight: 16,
    marginBottom: 2,
  },
  tipBody: {
    fontSize: 10,
    color: '#999',
    lineHeight: 14,
  },

  // Invite card
  inviteCard: {
    marginHorizontal: 14,
    marginTop: 6,
    borderRadius: 14,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 12,
    paddingBottom: 16,
    alignItems: 'center',
    gap: 8,
    borderColor: '#111',
    borderWidth:2,
    
  },

  inviteLogo: {
    marginTop: -8,
    width: 82,
    height: 82,
  },

  inviteTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111',
    textAlign: 'center',
    marginTop: -12,
  },
  inviteSub: {
    fontSize: 11,
    color: '#111',
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 240,

  },
  inviteBtn: {
    backgroundColor: YELLOW,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 4,
  },
  inviteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111',
  },
});