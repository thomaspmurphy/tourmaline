// @ts-expect-error: No types for @rails/actioncable
import { createConsumer } from '@rails/actioncable';

const cable = createConsumer();

export default cable; 