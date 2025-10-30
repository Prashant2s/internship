import { useRouter } from 'next/router';
import ChatRoom from '../../src/components/ChatRoom';

export default function GameRoomPage() {
  const router = useRouter();
  const { game } = router.query;
  if (!game) return null;
  return <ChatRoom mode="game" roomKey={game} />;
}
