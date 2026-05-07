import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, increment, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";


// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyBnaHZWGOnUp3bYNqL1S7pSEg9wj_qicMQ",
    authDomain: "allright-b84f6.firebaseapp.com",
    projectId: "allright-b84f6",
    storageBucket: "allright-b84f6.firebasestorage.app",
    messagingSenderId: "794982749928",
    appId: "1:794982749928:web:61f6bfd2c8ee0836651b5d",
    measurementId: "G-DTYT8MMT71"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const postsCol = collection(db, "posts");

// --- 실제 Firebase Firestore 연동 ---

// 게시글 등록
async function addPost(postData) {
    return await addDoc(postsCol, postData);
}

// 게시글 목록 가져오기 (실시간 업데이트 적용)
function subscribePosts(callback) {
    const q = query(postsCol, orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        const posts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(posts);
    });
}

// 게시글 삭제
async function deletePost(id) {
    await deleteDoc(doc(db, "posts", id));
}

// 게시글 추천/좋아요 업데이트
async function updateCounter(id, type) {
    const postRef = doc(db, "posts", id);
    await updateDoc(postRef, {
        [type]: increment(1)
    });
}

// 게시글 수정
async function editPost(id, updatedContent) {
    const postRef = doc(db, "posts", id);
    await updateDoc(postRef, {
        content: updatedContent
    });
}
// --------------------------------------------------------

// DOM 요소
const titleInput = document.getElementById("post-title");
const contentInput = document.getElementById("post-content");
const authorInput = document.getElementById("post-author");
const submitBtn = document.getElementById("submit-post");
const boardList = document.getElementById("board-list");

// 모달 관련 DOM 요소
const editModal = document.getElementById("edit-modal");
const editContentInput = document.getElementById("edit-post-content");
const saveEditBtn = document.getElementById("save-edit");
const cancelEditBtn = document.getElementById("cancel-edit");

const deleteModal = document.getElementById("delete-modal");
const confirmDeleteBtn = document.getElementById("confirm-delete");
const cancelDeleteBtn = document.getElementById("cancel-delete");

let currentEditingId = null;
let currentDeletingId = null;

// 날짜 포맷 함수
function formatDate(dateString) {
    const d = new Date(dateString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// 화면 랜더링 함수
function renderPosts(posts) {
    boardList.innerHTML = "";

    if (posts.length === 0) {
        boardList.innerHTML = "<p style='text-align:center; color:#666;'>등록된 게시글이 없습니다.</p>";
        return;
    }

    posts.forEach((post, index) => {
        const div = document.createElement("div");
        div.className = "post-item";
        div.style.animationDelay = `${index * 0.1}s`;
        div.innerHTML = `
            <div class="post-header">
                <h3>${post.title}</h3>
                <div class="post-actions">
                    <button class="btn-icon edit-btn" data-id="${post.id}" title="수정">✏️</button>
                    <button class="btn-icon delete-btn" data-id="${post.id}" title="삭제">🗑️</button>
                </div>
            </div>
            <p id="content-${post.id}" style="text-align: left;">${(post.content || '').replace(/\n/g, "<br>")}</p>
            <div class="post-footer">
                <div class="meta">
                    <span>작성자: <strong>${post.author}</strong></span>
                    <span>${formatDate(post.createdAt)}</span>
                </div>
                <div class="counters">
                    <button class="btn-counter recommend-btn" data-id="${post.id}">
                        👍 추천 <span>${post.recommends || 0}</span>
                    </button>
                    <button class="btn-counter like-btn" data-id="${post.id}">
                        ❤️ 좋아요 <span>${post.likes || 0}</span>
                    </button>
                </div>
            </div>
        `;
        boardList.appendChild(div);
    });
}

// 이벤트 위임 (Event Delegation)
boardList.addEventListener("click", async (e) => {
    const target = e.target.closest("button");
    if (!target) return;

    const id = target.dataset.id;
    if (!id) return;

    if (target.classList.contains("delete-btn")) {
        currentDeletingId = id;
        deleteModal.style.display = "flex";
    } else if (target.classList.contains("edit-btn")) {
        currentEditingId = id;
        const postP = document.getElementById(`content-${id}`);
        editContentInput.value = postP.innerText;
        editModal.style.display = "flex";
    } else if (target.classList.contains("recommend-btn")) {
        await updateCounter(id, "recommends");
    } else if (target.classList.contains("like-btn")) {
        await updateCounter(id, "likes");
    }
});

// 삭제 확인 처리
confirmDeleteBtn.addEventListener("click", async () => {
    if (currentDeletingId) {
        confirmDeleteBtn.disabled = true;
        await deletePost(currentDeletingId);
        deleteModal.style.display = "none";
        confirmDeleteBtn.disabled = false;
        currentDeletingId = null;
    }
});

cancelDeleteBtn.addEventListener("click", () => {
    deleteModal.style.display = "none";
    currentDeletingId = null;
});

// 모달 닫기 공통
const closeModals = () => {
    editModal.style.display = "none";
    deleteModal.style.display = "none";
    currentEditingId = null;
    currentDeletingId = null;
};

cancelEditBtn.addEventListener("click", closeModals);

// 수정 저장
saveEditBtn.addEventListener("click", async () => {
    if (currentEditingId && editContentInput.value.trim() !== "") {
        saveEditBtn.disabled = true;
        await editPost(currentEditingId, editContentInput.value.trim());
        saveEditBtn.disabled = false;
        closeModals();
    }
});

// 바깥 클릭시 모달 닫기
window.addEventListener("click", (e) => {
    if (e.target === editModal || e.target === deleteModal) closeModals();
});

// 글쓰기 이벤트
submitBtn.addEventListener("click", async () => {
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const author = authorInput.value.trim() || '익명';

    if (!title || !content) {
        alert("제목과 내용을 모두 입력해주세요!");
        return;
    }

    const originalBtnText = submitBtn.innerText;
    submitBtn.innerText = "등록 중...";
    submitBtn.disabled = true;

    // 파이어베이스에 업로드하는 것처럼 비동기 함수 호출
    await addPost({
        title,
        content,
        author,
        createdAt: new Date().toISOString(),
        likes: 0,
        recommends: 0
    });

    // 입력창 초기화
    titleInput.value = "";
    contentInput.value = "";
    authorInput.value = "";

    submitBtn.innerText = originalBtnText;
    submitBtn.disabled = false;
});

// 초기 실시간 구독 시작
subscribePosts((posts) => {
    renderPosts(posts);
});

// 네비게이션 스크롤 효과
window.addEventListener("scroll", () => {
    const nav = document.querySelector(".navbar");
    if (window.scrollY > 50) {
        nav.style.background = "rgba(0, 0, 0, 0.9)";
        nav.style.padding = "15px 40px";
    } else {
        nav.style.background = "rgba(0, 0, 0, 0.6)";
        nav.style.padding = "20px 40px";
    }
});
