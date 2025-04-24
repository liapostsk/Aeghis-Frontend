import { SignedIn, SignedOut, useUser } from '@clerk/clerk-expo'
import { Link } from 'expo-router'
import { Text, View } from 'react-native'

export default function Page() {
  const { user } = useUser()

  return (
    <View>
      <SignedIn>
        <Text>Hello {user?.emailAddresses[0].emailAddress}</Text>
      </SignedIn>
      <SignedOut>
        <Text>You are not signed in</Text>
        <Link href="/(onboarding)">
          <Text>Sign in</Text>
        </Link>
        
      </SignedOut>
    </View>
  )
}