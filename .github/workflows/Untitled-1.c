
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <limits.h>

/* ---------- Fibonacci Heap Node ---------- */

typedef struct Node {
    int id;
    int degree;
    long long load;
    bool mark;

    struct Node *parent;
    struct Node *child;
    struct Node *left;
    struct Node *right;
} Node;

/* ---------- Fibonacci Heap ---------- */

typedef struct {
    Node *min;
    int size;
} Heap;

/* Initialize an empty heap */
void initHeap(Heap *h) {
    h->min = NULL;
    h->size = 0;
}

/* Create a new node */
Node *createNode(int id, long long load) {
    Node *x = malloc(sizeof(Node));

    if (x == NULL) {
        printf("Memory allocation failed.\n");
        exit(EXIT_FAILURE);
    }

    x->id = id;
    x->load = load;
    x->degree = 0;
    x->mark = false;

    x->parent = NULL;
    x->child = NULL;
    x->left = x;
    x->right = x;

    return x;
}

/* Compare nodes: lower load wins; ties use lower ID */
bool less(Node *a, Node *b) {
    return a->load < b->load ||
          (a->load == b->load && a->id < b->id);
}

/* Remove a node from its circular doubly linked list */
void detach(Node *x) {
    x->left->right = x->right;
    x->right->left = x->left;
    x->left = x;
    x->right = x;
}

/* Insert x immediately after p */
void insertAfter(Node *p, Node *x) {
    x->right = p->right;
    x->left = p;
    p->right->left = x;
    p->right = x;
}

/* Add a node to the root list */
void addRoot(Heap *h, Node *x) {
    x->parent = NULL;
    x->mark = false;
    x->left = x;
    x->right = x;

    if (h->min == NULL) {
        h->min = x;
    } else {
        insertAfter(h->min, x);

        if (less(x, h->min))
            h->min = x;
    }
}

/* Search a circular list and its subtrees */
Node *findList(Node *start, int id) {
    if (start == NULL)
        return NULL;

    Node *x = start;

    do {
        if (x->id == id)
            return x;

        Node *found = findList(x->child, id);

        if (found != NULL)
            return found;

        x = x->right;

    } while (x != start);

    return NULL;
}

/* Search for a server in one heap */
Node *findServer(Heap *h, int id) {
    return findList(h->min, id);
}

/* Check uniqueness across both regions */
bool existsInEither(Heap *a, Heap *b, int id) {
    return findServer(a, id) != NULL ||
           findServer(b, id) != NULL;
}

/* ---------- ADD_SERVER / INSERT ---------- */

bool addServer(Heap *h, int id, long long load) {
    if (findServer(h, id) != NULL)
        return false;

    Node *x = createNode(id, load);

    addRoot(h, x);
    h->size++;

    return true;
}

/* ---------- Link two trees ---------- */
/* x must have priority over y */

void linkTree(Node *y, Node *x) {
    detach(y);

    y->parent = x;
    y->mark = false;

    if (x->child == NULL) {
        x->child = y;
        y->left = y;
        y->right = y;
    } else {
        insertAfter(x->child, y);
    }

    x->degree++;
}

/* ---------- Consolidate after Extract-Min ---------- */

void consolidate(Heap *h) {
    if (h->min == NULL)
        return;

    int capacity = h->size + 1;

    Node **roots = malloc((size_t)capacity * sizeof(Node *));

    Node **table = calloc((size_t)capacity, sizeof(Node *));

    if (roots == NULL || table == NULL) {
        free(roots);
        free(table);
        printf("Memory allocation failed.\n");
        exit(EXIT_FAILURE);
    }

    /* Save the original root list */
    Node *x = h->min;
    int count = 0;

    do {
        roots[count++] = x;
        x = x->right;
    } while (x != h->min);

    /* Combine roots having equal degree */
    for (int i = 0; i < count; i++) {
        x = roots[i];

        /* It may already have become a child */
        if (x->parent != NULL)
            continue;

        int d = x->degree;

        while (d < capacity && table[d] != NULL) {
            Node *y = table[d];

            /* Make the smaller-key root the parent */
            if (less(y, x)) {
                Node *temp = x;
                x = y;
                y = temp;
            }

            table[d] = NULL;

            linkTree(y, x);
            d = x->degree;
        }

        if (d >= capacity) {
            free(roots);
            free(table);
            printf("Consolidation degree overflow.\n");
            exit(EXIT_FAILURE);
        }

        table[d] = x;
    }

    /* Rebuild the root list and minimum pointer */
    h->min = NULL;

    for (int i = 0; i < capacity; i++) {
        if (table[i] != NULL &&
            table[i]->parent == NULL) {

            Node *r = table[i];

            r->left = r;
            r->right = r;

            if (h->min == NULL) {
                h->min = r;
            } else {
                insertAfter(h->min, r);

                if (less(r, h->min))
                    h->min = r;
            }
        }
    }

    free(roots);
    free(table);
}

/* ---------- ALLOCATE_REQUEST / EXTRACT-MIN ---------- */

bool extractMin(Heap *h, int *id, long long *load) {
    Node *z = h->min;

    if (z == NULL)
        return false;

    *id = z->id;
    *load = z->load;

    /* Move all children of z to the root list */
    while (z->child != NULL) {
        Node *c = z->child;

        if (c->right == c)
            z->child = NULL;
        else
            z->child = c->right;

        detach(c);
        z->degree--;

        addRoot(h, c);
    }

    /* Remove z from the root list */
    if (z->right == z) {
        h->min = NULL;
    } else {
        Node *next = z->right;

        detach(z);
        h->min = next;

        consolidate(h);
    }

    free(z);
    h->size--;

    return true;
}

/* ---------- CUT ---------- */

void cut(Heap *h, Node *x, Node *y) {
    /* Update the parent's child pointer */
    if (y->child == x) {
        if (x->right == x)
            y->child = NULL;
        else
            y->child = x->right;
    }

    detach(x);
    y->degree--;

    addRoot(h, x);
}

/* ---------- CASCADING CUT ---------- */

void cascadingCut(Heap *h, Node *y) {
    Node *p = y->parent;

    if (p == NULL)
        return;

    if (!y->mark) {
        y->mark = true;
    } else {
        cut(h, y, p);
        cascadingCut(h, p);
    }
}

/* ---------- UPDATE_LOAD / DECREASE-KEY ---------- */

bool updateLoad(Heap *h, int id, long long newLoad) {
    Node *x = findServer(h, id);

    if (x == NULL || newLoad > x->load)
        return false;

    x->load = newLoad;

    Node *p = x->parent;

    /* Restore heap order if necessary */
    if (p != NULL && less(x, p)) {
        cut(h, x, p);
        cascadingCut(h, p);
    }

    if (h->min == NULL || less(x, h->min))
        h->min = x;

    return true;
}

/* ---------- MERGE_REGIONS / UNION ---------- */

void mergeRegions(Heap *a, Heap *b) {
    if (b->min == NULL)
        return;

    if (a->min == NULL) {
        a->min = b->min;
    } else {
        Node *x = a->min;
        Node *y = b->min;

        Node *xr = x->right;
        Node *yl = y->left;

        /* Splice the two circular root lists */
        x->right = y;
        y->left = x;

        yl->right = xr;
        xr->left = yl;

        if (less(y, a->min))
            a->min = y;
    }

    a->size += b->size;

    /* Ownership of b's nodes moves to a */
    b->min = NULL;
    b->size = 0;
}

/* ---------- LEAST_LOADED_SERVER / MINIMUM ---------- */

void leastLoaded(Heap *h) {
    if (h->min == NULL) {
        printf("No active servers in this region.\n");
        return;
    }

    printf("Least-loaded server: S%d | Load: %lld\n",
           h->min->id, h->min->load);
}

/* ---------- DECOMMISSION_SERVER / DELETE ---------- */

bool decommissionServer(Heap *h, int id) {
    Node *x = findServer(h, id);

    if (x == NULL)
        return false;

    /* Valid loads are nonnegative, so LLONG_MIN is smaller */
    if (!updateLoad(h, id, LLONG_MIN))
        return false;

    int removedID;
    long long removedLoad;

    return extractMin(h, &removedID, &removedLoad);
}

/* ---------- DISPLAY SERVERS ---------- */

void displayList(Node *start) {
    if (start == NULL)
        return;

    Node *x = start;

    do {
        printf("S%d(load=%lld, degree=%d) ",
               x->id, x->load, x->degree);

        if (x->child != NULL) {
            printf("{ ");
            displayList(x->child);
            printf("} ");
        }

        x = x->right;

    } while (x != start);
}

void displayHeap(Heap *h, int region) {
    printf("\nRegion %d: ", region);

    if (h->min == NULL) {
        printf("Empty\n");
        return;
    }

    printf("\nHeap size: %d\n", h->size);
    printf("Minimum: S%d, load %lld\n",
           h->min->id, h->min->load);

    printf("Trees: ");
    displayList(h->min);
    printf("\n");
}

/* ---------- FREE ALL NODES ---------- */

void freeHeap(Heap *h) {
    int id;
    long long load;

    while (h->min != NULL)
        extractMin(h, &id, &load);
}

/* ---------- MAIN PROGRAM ---------- */

int main(void) {
    Heap region1, region2;

    initHeap(&region1);
    initHeap(&region2);

    int n;

    printf("Enter initial number of servers: ");

    if (scanf("%d", &n) != 1 || n < 0) {
        printf("Invalid number of servers.\n");
        return 1;
    }

    /* Enter initial servers and their regions */
    for (int i = 0; i < n; i++) {
        int id, region;
        long long load;

        printf("\nServer %d - enter ID, load, region (1 or 2): ",
               i + 1);

        if (scanf("%d %lld %d", &id, &load, &region) != 3) {
            printf("Invalid input.\n");
            freeHeap(&region1);
            freeHeap(&region2);
            return 1;
        }

        if (load < 0 || (region != 1 && region != 2) ||
            existsInEither(&region1, &region2, id)) {
            printf("Invalid load, region, or duplicate ID.\n");
            i--;
            continue;
        }

        Heap *target = (region == 1) ? &region1 : &region2;

        addServer(target, id, load);
    }

    int choice;

    do {
        printf("\n========== CLOUD LOAD BALANCER ==========\n");
        printf("1. Add Server\n");
        printf("2. Allocate Request\n");
        printf("3. Update Load (Decrease-Key)\n");
        printf("4. Merge Regions\n");
        printf("5. Least-Loaded Server\n");
        printf("6. Decommission Server\n");
        printf("7. Display Regions\n");
        printf("0. Exit\n");
        printf("Enter choice: ");

        if (scanf("%d", &choice) != 1)
            break;

        int id, region;
        long long load;
        Heap *target;

        switch (choice) {
        case 1:
            printf("Enter server ID, load, region (1 or 2): ");

            if (scanf("%d %lld %d", &id, &load, &region) != 3)
                break;

            if (load < 0 ||
                (region != 1 && region != 2) ||
                existsInEither(&region1, &region2, id)) {
                printf("Invalid load, region, or duplicate ID.\n");
                break;
            }

            target = (region == 1) ? &region1 : &region2;

            addServer(target, id, load);
            printf("Server added successfully.\n");
            break;

        case 2: {
            printf("Enter region (1 or 2): ");

            if (scanf("%d", &region) != 1 ||
                (region != 1 && region != 2)) {
                printf("Invalid region.\n");
                break;
            }

            target = (region == 1) ? &region1 : &region2;

            long long oldLoad;
            int allocatedID;

            if (!extractMin(target, &allocatedID, &oldLoad)) {
                printf("No active servers in this region.\n");
                break;
            }

            printf("Allocated server S%d, old load %lld\n",
                   allocatedID, oldLoad);

            printf("Enter its updated load (greater than %lld): ",
                   oldLoad);

            if (scanf("%lld", &load) != 1)
                load = oldLoad;

            /* Reinsert the allocated server as required by the lab */
            if (load > oldLoad && load >= 0) {
                addServer(target, allocatedID, load);
                printf("Server reinserted with load %lld.\n", load);
            } else {
                addServer(target, allocatedID, oldLoad);
                printf("Invalid increase. Server restored at old load.\n");
            }

            break;
        }

        case 3:
            printf("Enter region, server ID, new lower load: ");

            if (scanf("%d %d %lld", &region, &id, &load) != 3)
                break;

            if ((region != 1 && region != 2) || load < 0) {
                printf("Invalid input.\n");
                break;
            }

            target = (region == 1) ? &region1 : &region2;

            if (updateLoad(target, id, load))
                printf("Load updated successfully.\n");
            else
                printf("Invalid server ID or load increase.\n");

            break;

        case 4:
            mergeRegions(&region1, &region2);
            printf("Region 2 merged into Region 1.\n");
            printf("Region 2 is now empty.\n");
            break;

        case 5:
            printf("Enter region (1 or 2): ");

            if (scanf("%d", &region) != 1 ||
                (region != 1 && region != 2)) {
                printf("Invalid region.\n");
                break;
            }

            target = (region == 1) ? &region1 : &region2;
            leastLoaded(target);
            break;

        case 6:
            printf("Enter region and server ID: ");

            if (scanf("%d %d", &region, &id) != 2)
                break;

            if (region != 1 && region != 2) {
                printf("Invalid region.\n");
                break;
            }

            target = (region == 1) ? &region1 : &region2;

            if (decommissionServer(target, id))
                printf("Server S%d decommissioned.\n", id);
            else
                printf("Server not found in that region.\n");

            break;

        case 7:
            displayHeap(&region1, 1);
            displayHeap(&region2, 2);
            break;

        case 0:
            printf("Exiting program...\n");
            break;

        default:
            printf("Invalid choice.\n");
        }

    } while (choice != 0);

    freeHeap(&region1);
    freeHeap(&region2);

    return 0;
}
