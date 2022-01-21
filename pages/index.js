import Head from "next/head"
import { useState } from "react"
import { Octokit } from "@octokit/rest"
import ProgressBar from "@ramonak/react-progress-bar";


export default function Home() {
  const [createNewRepository, setCreateNewRepository] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [display, setDisplay] = useState("none");
  const [username, setUsername] = useState("");
  const [repoName, setRepoName] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  async function getPosts(username, pageNumber) {
    if (pageNumber === undefined) {
      pageNumber = 1
    }
    // fetch blogs for user from dev.to
    const res = await fetch(`https://dev.to/api/articles?username=${username}&page=${pageNumber}`)
    const data = await res.json()
    return data;
  }
  async function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }
  async function fetchAllPosts() {
    let pageNumber = 1;
    let data = await getPosts(username, pageNumber);
    let posts = data;
    if (posts.length !== 30) {
      return posts;
    }

    while (true) {
      pageNumber++;
      data = await getPosts(username, pageNumber);
      posts = posts.concat(data);
      if (data.length !== 30) {
        return posts;
      }
    }


  }

  async function fetchReadme(blog_id) {
    while (true) {
      try {
        // fetch the details about the blog from dev.to and then console log the markdown
        const res = await fetch(`https://dev.to/api/articles/${blog_id}`)
        const data = await res.json()

        return data.body_markdown

      }
      catch (error) {
        await sleep(3);
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const octokit = new Octokit({
      auth: githubToken
    });



    setFetching(true);
    const posts = await fetchAllPosts()
    setFetching(false);
    setTotal(posts.length)
    setProgress(0);
    setDisplay("");
    if (createNewRepository) {
      const { data } = await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        description: "This is a test repository",
        private: isPrivate
      });
    }

    let progress_var = 0;
    const owner = (await octokit.users.getAuthenticated()).data.login
    for (let post of posts) {
      const readme = await fetchReadme(post.id)
      const { data } = octokit.rest.repos.createOrUpdateFileContents({
        owner: owner,
        repo: repoName,
        path: `${post.id}.md`,
        message: "Test commit",
        content: Buffer.from(readme).toString("base64"),
        committer: {
          email: "test@test.org",
          name: "DEV.to backup Bot",
        }

      }).then(res => {
        setProgress(progress_var + 1)
        progress_var++;
      })
      await sleep(1)
    }
  }
  return (
    <div className="container">
      <br />

      <div className="text-center">
        <h1>
          Backup all your dev.to posts
        </h1>
      </div>


      <br />
      {/*Create a bootstrap form */}
      <form onSubmit={handleSubmit}>
        <div className={"form-group"}>
          <label
            htmlFor={"username"}
          >

            DEV Username
          </label>
          <input
            type={"text"}
            className={"form-control"}
            id={"username"}
            aria-describedby={"DEVUsername"}
            placeholder={"Enter username"}
            value={username}
            onChange={
              (e) => {
                setUsername(e.target.value)
              }
            }
            required
          />
          <br />
          <label htmlFor="repoName">
            Repo Name
          </label>
          <input
            type={"text"}
            className={"form-control"}
            id={"repoName"}
            aria-describedby={"RepoName"}
            placeholder={"Enter Repo Name"}
            value={repoName}
            onChange={
              (e) => {
                setRepoName(e.target.value)
              }
            }
            required
          />

          <br />
          <label htmlFor="githubToken">
            Github Token
          </label>
          <input
            type={"text"}
            className={"form-control"}
            id={"githubToken"}
            aria-describedby={"GithubToken"}
            placeholder={"Enter Github Token"}
            value={githubToken}
            onChange={
              (e) => {
                setGithubToken(e.target.value)
              }
            }
            required
          />
          <br />
          <div className="form-group form-check">
            <input
              type={"checkbox"}
              className={"form-check-input"}
              id={"isPrivate"}
              aria-describedby={"IsPrivate"}
              placeholder={"Is Private"}
              checked={isPrivate}
              onChange={
                (e) => {
                  setIsPrivate(e.target.checked)
                }
              }

            />
            <label htmlFor="isPrivate" className="form-check-label">
              Is Private
            </label>

          </div>

          <div className="form-group form-check">
            <input
              type={"checkbox"}
              className={"form-check-input"}
              id={"initializeRepo"}
              aria-describedby={"initializeRepo"}
              placeholder={"Initialize Repo"}
              checked={createNewRepository}
              onChange={
                (e) => {
                  setCreateNewRepository(e.target.checked)
                }
              }

            />
            <label htmlFor="initializeRepo" className="form-check-label">
              Initialize new repository
            </label>

          </div>

          {
            fetching ?
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="sr-only">Fecthing posts...</span>
                </div>
              </div>
              :
              <></>
          }

        </div>

        <button
          type={"submit"}
          className={"btn btn-primary"}
        >
          Submit
        </button>
      </form>
      <br />
      <div style={{ display: display }}>
        <h3 className="text-center">
          There are total {total} posts to backup
        </h3>
        <br />
        <ProgressBar
          completed={`${progress}`}
          maxCompleted={`${total}`}
          bgColor="blue"
        />
        {
          progress === total ?
            <>
              <br />
              <h3 className="text-center">
                Backup Completed
              </h3>
            </>
            :
            <>
              <br />
              <h3 className="text-center">
                Backup in progress
              </h3>
            </>
        }
      </div>

    </div>

  )
}
