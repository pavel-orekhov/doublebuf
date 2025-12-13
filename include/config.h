#ifndef LOCKFREE_DB_CONFIG_H
#define LOCKFREE_DB_CONFIG_H

#ifndef BUFFER_CAPACITY
#define BUFFER_CAPACITY (100 * 1024 * 1024)
#endif

#ifndef WRITER_COUNT
#define WRITER_COUNT 4
#endif

#ifndef OUTPUT_FILE_PATH
#define OUTPUT_FILE_PATH "/tmp/(time_t).cap"
#endif

#ifndef DEBUG_MODE
#define DEBUG_MODE 0
#endif

#ifndef ENABLE_STATS
#define ENABLE_STATS 1
#endif

#endif
