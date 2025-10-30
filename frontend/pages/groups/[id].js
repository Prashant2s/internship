import { useRouter } from 'next/router';
import ChatRoom from '../../src/components/ChatRoom';

export default function GroupPage() {
  const router = useRouter();
  const { id } = router.query;
  if (!id) return null;
  return <ChatRoom mode="group" roomKey={id} />;
}
