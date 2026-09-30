#include <stdio.h>
#include <stdlib.h>

#define N 20   // Use small N for testing, later change to 100000

int parent[N+1], size[N+1];
int totalCommunities, largestCommunity;

// Path Compression
int find(int x) {
    if (parent[x] != x)
        parent[x] = find(parent[x]);
    return parent[x];
}

// Union by Size
void unionSets(int a, int b) {
    a = find(a);
    b = find(b);
    if (a != b) {
        if (size[a] < size[b]) {
            int temp = a; a = b; b = temp;
        }
        parent[b] = a;
        size[a] += size[b];
        if (size[a] > largestCommunity) largestCommunity = size[a];
        totalCommunities--;
    }
}

void initialize() {
    for (int i = 1; i <= N; i++) {
        parent[i] = i;
        size[i] = 1;
    }
    totalCommunities = N;
    largestCommunity = 1;
}

int main() {
    initialize();
    int choice, a, b;

    while (1) {
        printf("\n===== SOCIAL NETWORK MENU =====\n");
        printf("1. FRIEND A B (Union)\n");
        printf("2. CONNECTED A B (Check)\n");
        printf("3. COMMUNITY-SIZE A\n");
        printf("4. TOTAL-COMMUNITIES\n");
        printf("5. LARGEST-COMMUNITY\n");
        printf("6. Exit\n");
        printf("Enter choice: ");
        if (scanf("%d", &choice) != 1) break;

        switch (choice) {
            case 1:
                printf("Enter two users (A B): ");
                scanf("%d %d", &a, &b);
                if (a>=1 && a<=N && b>=1 && b<=N) {
                    unionSets(a, b);
                    printf("Users %d and %d are now friends.\n", a, b);
                } else {
                    printf("Invalid IDs! Use 1-%d\n", N);
                }
                break;

            case 2:
                printf("Enter two users (A B): ");
                scanf("%d %d", &a, &b);
                if (find(a) == find(b))
                    printf("Yes, %d and %d are connected.\n", a, b);
                else
                    printf("No, %d and %d are not connected.\n", a, b);
                break;

            case 3:
                printf("Enter user A: ");
                scanf("%d", &a);
                printf("Community size of %d: %d\n", a, size[find(a)]);
                break;

            case 4:
                printf("Total Communities: %d\n", totalCommunities);
                break;

            case 5:
                printf("Largest Community Size: %d\n", largestCommunity);
                break;

            case 6:
                return 0;

            default:
                printf("Invalid choice!\n");
        }
    }
    return 0;
}
