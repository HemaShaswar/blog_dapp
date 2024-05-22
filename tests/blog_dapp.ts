import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BlogDapp } from "../target/types/blog_dapp";
import { assert } from "chai";

describe("blog_dapp", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.BlogDapp as Program<BlogDapp>;
  const provider = anchor.AnchorProvider.env();

  let globalState = anchor.web3.Keypair.generate();
  let blogPost = anchor.web3.Keypair.generate();

  it("Initializes the Global State", async () => {
    const tx = await program.methods
      .initialize()
      .accounts({
        globalState: globalState.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([globalState])
      .rpc();

    console.log("Initialization transaction signature", tx);

    const state = await program.account.globalState.fetch(
      globalState.publicKey
    );
    assert.equal(state.totalPosts.toString(), "0");
  });

  it("Creates a blog post (happy path)", async () => {
    const tx = await program.methods
      .createPost("My First Post", "This is the content of the first post")
      .accounts({
        blogPost: blogPost.publicKey,
        globalState: globalState.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([blogPost])
      .rpc();

    console.log("Create post transaction signature", tx);

    const post = await program.account.blogPost.fetch(blogPost.publicKey);
    assert.equal(post.title, "My First Post");
    assert.equal(post.content, "This is the content of the first post");

    const state = await program.account.globalState.fetch(
      globalState.publicKey
    );
    assert.equal(state.totalPosts.toString(), "1");
  });

  it("Fails to create a blog post with empty title (unhappy path)", async () => {
    const emptyTitlePost = anchor.web3.Keypair.generate();
    try {
      await program.methods
        .createPost("", "This is the content of a post with no title")
        .accounts({
          blogPost: emptyTitlePost.publicKey,
          globalState: globalState.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([emptyTitlePost])
        .rpc();

      assert.fail("Blog post creation should have failed due to empty title");
    } catch (err) {
      console.log("Error message:", err.toString());
      assert.ok(err.toString().includes("InvalidTitle"));
    }
  });

  it("Edits a blog post (happy path)", async () => {
    const tx = await program.methods
      .editPost("Updated Title", "Updated Content")
      .accounts({
        blogPost: blogPost.publicKey,
        author: provider.wallet.publicKey,
      })
      .rpc();

    console.log("Edit post transaction signature", tx);

    const post = await program.account.blogPost.fetch(blogPost.publicKey);
    assert.equal(post.title, "Updated Title");
    assert.equal(post.content, "Updated Content");
  });

  it("Fails to delete a blog post by unauthorized user (unhappy path)", async () => {
    const unauthorizedUser = anchor.web3.Keypair.generate();
    const unauthorizedUserPubkey = unauthorizedUser.publicKey;
    console.log(
      "Unauthorized User PublicKey:",
      unauthorizedUserPubkey.toString()
    );
    console.log(
      "Blog Post Author PublicKey:",
      provider.wallet.publicKey.toString()
    );

    try {
      await program.methods
        .deletePost()
        .accounts({
          blogPost: blogPost.publicKey,
          globalState: globalState.publicKey,
          author: unauthorizedUserPubkey,
        })
        .signers([unauthorizedUser])
        .rpc();

      assert.fail(
        "Blog post deletion should have failed due to unauthorized user"
      );
    } catch (err) {
      console.log("Error message:", err.toString());
      if (err.error && err.error.errorCode) {
        console.log("Error code:", err.error.errorCode.code);
        console.log("Error number:", err.error.errorCode.number);
        console.log("Error message:", err.error.errorMessage);
        assert.ok(err.error.errorCode.code === "Unauthorized");
      } else {
        console.error("Unexpected error format:", err);
      }
    }
  });

  it("Deletes a blog post (happy path)", async () => {
    const tx = await program.methods
      .deletePost()
      .accounts({
        blogPost: blogPost.publicKey,
        globalState: globalState.publicKey,
        author: provider.wallet.publicKey,
      })
      .rpc();

    console.log("Delete post transaction signature", tx);

    try {
      await program.account.blogPost.fetch(blogPost.publicKey);
      assert.fail("Blog post should be deleted");
    } catch (err) {
      console.log("Error message:", err.toString());
      assert.ok(err.toString().includes("Account does not exist"));
    }

    const state = await program.account.globalState.fetch(
      globalState.publicKey
    );
    assert.equal(state.totalPosts.toString(), "0");
  });

  it("Fails to delete a blog post by unauthorized user (unhappy path)", async () => {
    const unauthorizedUser = anchor.web3.Keypair.generate();
    try {
      await program.methods
        .deletePost()
        .accounts({
          blogPost: blogPost.publicKey,
          globalState: globalState.publicKey,
          author: unauthorizedUser.publicKey,
        })
        .signers([unauthorizedUser])
        .rpc();

      assert.fail(
        "Blog post deletion should have failed due to unauthorized user"
      );
    } catch (err) {
      console.log("Error message:", err.toString());
      if (err.error && err.error.errorCode) {
        console.log("Error code:", err.error.errorCode.code);
        console.log("Error number:", err.error.errorCode.number);
        console.log("Error message:", err.error.errorMessage);
        assert.ok(
          err.error.errorCode.code === "ConstraintHasOne" ||
            err.error.errorCode.code === "Unauthorized"
        );
      } else {
        console.error("Unexpected error format:", err);
      }
    }
  });

  it("Lists all blog posts", async () => {
    // Create two posts
    const blogPost1 = anchor.web3.Keypair.generate();
    const blogPost2 = anchor.web3.Keypair.generate();

    await program.methods
      .createPost("First Post", "First post content")
      .accounts({
        blogPost: blogPost1.publicKey,
        globalState: globalState.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([blogPost1])
      .rpc();

    await program.methods
      .createPost("Second Post", "Second post content")
      .accounts({
        blogPost: blogPost2.publicKey,
        globalState: globalState.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([blogPost2])
      .rpc();

    // List posts
    const state = await program.account.globalState.fetch(
      globalState.publicKey
    );
    assert.equal(state.totalPosts.toString(), "2");
    assert.equal(state.postAddresses.length, 2);
  });
});
